import nunjucks from 'nunjucks'
import fs from 'fs-extra'
import yaml from 'yaml'
import slugify from 'slugify'

import nestedGet from 'lodash.get'
import nestedSet from 'lodash.set'
import { struct } from 'superstruct'
import {
  FormResponse,
  FieldMapping,
  TrelloLabel,
  LabelMapping,
  MappingConfig
} from './types'
import { MappingConfigStruct } from './structs'

export type SimpleTrelloLabel = Pick<TrelloLabel, 'id' | 'name'>

export type MatchedLabel =
  | { type: 'link'; id: string }
  | { type: 'create'; name: string }

export interface NewCard {
  title: string
  body: string
  labels: MatchedLabel[]
}

const slugOptions = {
  lower: true
}

export async function loadTemplate(path: string): Promise<nunjucks.Template> {
  return nunjucks.compile(await fs.readFile(path, 'utf8'))
}

export async function loadMapping(path: string): Promise<MappingConfig> {
  return MappingConfigStruct(yaml.parse(await fs.readFile(path, 'utf8')))
}

export function parseResponse(
  response: FormResponse,
  mapping: FieldMapping
): any {
  const newObject: any = {}

  for (const id in mapping) {
    const { path, type } = mapping[id]

    const rawValue: string = Array.isArray(response[id]) ? response[id][0] : ''
    let value

    switch (type) {
      case 'text':
        value = rawValue
        break
      case 'csv':
        value = rawValue.split(',').map(v => v.trim())
        break
    }

    nestedSet(newObject, path, value)
  }

  return newObject
}

export function findLabels(
  parsedResponse: any,
  labelMapping: LabelMapping,
  trelloLabels: SimpleTrelloLabel[]
): MatchedLabel[] {
  const matches: MatchedLabel[] = []

  for (const fieldPath in labelMapping) {
    const { prefix } = labelMapping[fieldPath]
    const values: string[] = nestedGet(parsedResponse, fieldPath)

    if (!Array.isArray(values)) continue

    for (let value of values) {
      const labelName = prefix + ':' + slugify(value, slugOptions)

      const trelloLabel = trelloLabels.find(l => l.name === labelName)

      if (trelloLabel) {
        matches.push({ type: 'link', id: trelloLabel.id })
      } else {
        matches.push({ type: 'create', name: labelName })
      }
    }
  }

  return matches
}

export function createCardFromFormResponse(
  formResponse: FormResponse,
  config: MappingConfig,
  trelloLables: SimpleTrelloLabel[],
  renderer: (data: any) => string
): NewCard {
  const response = parseResponse(formResponse, config.fields)

  return {
    title: nestedGet(response, config.titleKey),
    body: renderer({ data: response }),
    labels: findLabels(response, config.labels, trelloLables)
  }
}

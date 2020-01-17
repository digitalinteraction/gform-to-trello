import nunjucks from 'nunjucks'
import fs from 'fs-extra'
import yaml from 'yaml'
import slugify from 'slugify'
import debugFn from 'debug'

import nestedGet from 'lodash.get'
import nestedSet from 'lodash.set'
import {
  FormResponse,
  FieldMapping,
  LabelMapping,
  MappingConfig
} from './types'
import { MappingConfigStruct } from './structs'
import { TrelloClient, TrelloLabel, TrelloColor } from '@openlab/trello-client'

export type SimpleTrelloLabel = Pick<TrelloLabel, 'id' | 'name'>

export type MatchedLabel =
  | { type: 'link'; id: string }
  | { type: 'create'; name: string; color: TrelloColor }

export interface NewCard {
  title: string
  body: string
  labels: MatchedLabel[]
}

const debug = debugFn('catalyst:processor')

const slugOptions = {
  lower: true,
  remove: /[*+~.()[\]{}'"!:@]/g
}

export async function loadTemplate(path: string): Promise<nunjucks.Template> {
  debug(`#loadTemplate path=${path}`)
  return nunjucks.compile(await fs.readFile(path, 'utf8'))
}

export function renderTemplate(
  template: nunjucks.Template,
  context: object | undefined
) {
  return template
    .render(context)
    .replace(/\n{2,}/gm, '\n\n')
    .trim()
}

export async function loadMapping(path: string): Promise<MappingConfig> {
  debug(`#loadMapping path=${path}`)
  return MappingConfigStruct(yaml.parse(await fs.readFile(path, 'utf8')))
}

export function parseResponse(
  formResponse: FormResponse,
  mapping: FieldMapping
): any {
  debug(`#parseResponse`)

  const newObject: any = {}

  for (const id in mapping) {
    const { path } = mapping[id]

    const fieldResponse = formResponse[id]

    if (fieldResponse !== undefined) {
      nestedSet(newObject, path, fieldResponse.value)
    } else {
      nestedSet(newObject, path, null)
    }
  }

  return newObject
}

export function findLabels(
  parsedResponse: any,
  labelMapping: LabelMapping,
  trelloLabels: SimpleTrelloLabel[]
): MatchedLabel[] {
  debug(`#findLabels`)

  const matches: MatchedLabel[] = []

  for (const fieldPath in labelMapping) {
    const { prefix, color } = labelMapping[fieldPath]
    let values: string[] = nestedGet(parsedResponse, fieldPath)

    if (typeof values === 'string') values = [values]
    if (!Array.isArray(values)) continue

    for (let value of values) {
      const labelName = prefix + ':' + slugify(value, slugOptions)

      const trelloLabel = trelloLabels.find(l => l.name === labelName)

      if (trelloLabel) {
        matches.push({ type: 'link', id: trelloLabel.id })
      } else {
        matches.push({ type: 'create', name: labelName, color })
      }
    }
  }

  return matches
}

export function generateCardFromFormResponse(
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

export async function createCardAndMatchLabels(
  card: NewCard,
  trello: TrelloClient,
  idBoard: string,
  idList: string
) {
  debug(
    `#createCardAndMatchLabels board=${idBoard} list=${idList} card=${card.title}`
  )

  const idLabels: string[] = []
  const promises: Promise<any>[] = []

  for (let label of card.labels) {
    if (label.type === 'create') {
      const toCreate = {
        name: label.name,
        color: label.color
      }

      promises.push(
        new Promise(async (resolve, reject) => {
          const label = await trello.createLabel(idBoard, toCreate)

          debug(`Creating label ${label.id} ${label.name}`)

          resolve(label.id)
        })
      )
    } else {
      debug(`Linking label ${label.id}`)
      idLabels.push(label.id)
    }
  }

  idLabels.push(...(await Promise.all(promises)))

  const newCard = await trello.createCard({
    name: card.title,
    desc: card.body,
    idList,
    idLabels
  })

  return newCard
}

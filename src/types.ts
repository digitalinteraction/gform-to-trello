import { TrelloColor } from '@openlab/trello-client'

export interface MappingConfig {
  titleKey: string
  fields: FieldMapping
  labels: LabelMapping
}

export interface FieldMapping {
  [id: string]: {
    path: string
  }
}

export interface LabelMapping {
  [fieldPath: string]: { prefix: string; color: TrelloColor }
}

export interface FieldResponse {
  type: string
  index: number
  title: string
  value: string | string[]
}

export interface FormResponse {
  [idx: string]: FieldResponse
}

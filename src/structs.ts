import { struct } from 'superstruct'
import { labelColors } from '@openlab/trello-client'

export const TrelloColor = struct.enum(labelColors)

export const FieldMappingStruct = struct({
  path: 'string'
})

export const LabelMappingStruct = struct({
  prefix: 'string',
  color: TrelloColor
})

export const MappingConfigStruct = struct({
  titleKey: 'string',
  fields: struct.record(['string', FieldMappingStruct]),
  labels: struct.record(['string', LabelMappingStruct])
})

export const FieldResponseStruct = struct({
  type: 'string',
  index: 'number',
  title: 'string',
  value: struct.union(['string', ['string']])
})

export const FormResponseStruct = struct.record(['string', FieldResponseStruct])

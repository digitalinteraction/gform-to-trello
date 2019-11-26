import { struct } from 'superstruct'

export const TrelloColor = struct.enum([
  'yellow',
  'purple',
  'blue',
  'red',
  'green',
  'orange',
  'black',
  'sky',
  'pink',
  'lime',
  null
])

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

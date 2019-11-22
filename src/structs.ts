import { struct } from 'superstruct'

export const FieldMappingStruct = struct({
  path: 'string',
  type: struct.enum(['csv', 'text'])
})

export const LabelMappingStruct = struct({
  prefix: 'string'
})

export const MappingConfigStruct = struct({
  titleKey: 'string',
  fields: struct.record(['string', FieldMappingStruct]),
  labels: struct.record(['string', LabelMappingStruct])
})

export const FormResponseStruct = struct.record(['string', ['string']])

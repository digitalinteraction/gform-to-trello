export type TrelloColor =
  | 'yellow'
  | 'purple'
  | 'blue'
  | 'red'
  | 'green'
  | 'orange'
  | 'black'
  | 'sky'
  | 'pink'
  | 'lime'
  | null

export interface TrelloLabel {
  id: string
  name: string
  color: TrelloColor
}

export interface TrelloMembership {
  deactivate: false
  id: string
  idMember: string
  memberType: string
  unconfirmed: false
}

// https://developers.trello.com/reference#board-object
export interface TrelloBoard {
  id: string
  name: string
  desc: string
  descData: any
  closed: boolean
  idOrganization: string
  pinned: boolean
  url: string
  shortUrl: string
  prefs: any
  labelNames: { [name: string]: string }
  starred: boolean
  limits: any
  memberships: TrelloMembership[]
  enterpriseOwned: boolean
}

// https://developers.trello.com/reference#organization-object
export interface TrelloOrganization {
  id: string
  desc: string
  descData: any
  displayName: string
  invitations: any
  invited: any
  idBoards: string[]
  name: string
  powerUps: any
  prefs: any
  premiumFeatures: any
  products: any
  url: string
  website: string
}

// https://developers.trello.com/reference#list-object
export interface TrelloList {
  id: string
  name: string
  closed: boolean
  idBoard: string
  pos: number
  subscribed: boolean
  softLimit: number | null
}

export interface TrelloCard {
  id: string
  // checkItemStates: null
  closed: boolean
  dateLastActivity: string
  desc: string
  descData: any
  dueReminder: string | null
  idBoard: string
  idList: string
  idMembersVoted: string[]
  idShort: number
  idAttachmentCover: string | null
  idLabels: string[]
  manualCoverAttachment: boolean
  name: string
  pos: number
  shortLink: string
  isTemplate: boolean
  badges: any
  dueComplete: boolean
  due: string | null
  idChecklists: string[]
  idMembers: string[]
  labels: TrelloLabel[]
  shortUrl: string
  subscribed: boolean
  url: string
  cover: any
}

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

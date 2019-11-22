export interface TrelloLabel {
  id: string
  name: string
  color: string
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
  descData: string | null
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
  descData: string | null
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

export interface MappingConfig {
  titleKey: string
  fields: FieldMapping
  labels: LabelMapping
}

export interface FieldMapping {
  [id: string]: {
    path: string
    type: 'csv' | 'text'
  }
}

export interface LabelMapping {
  [fieldPath: string]: { prefix: string }
}

export interface FormResponse {
  [idx: string]: string | string[]
}

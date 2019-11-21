import got from 'got'

interface TrelloLabel {
  id: string
  name: string
  color: string
}

interface TrelloMembership {
  deactivate: false
  id: string
  idMember: string
  memberType: string
  unconfirmed: false
}

// https://developers.trello.com/reference#board-object
interface TrelloBoard {
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
interface TrelloOrganization {
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

export class TrelloClient {
  client: got.GotInstance<got.GotJSONFn>

  constructor(public appKey: string, public token: string) {
    this.client = got.extend({
      baseUrl: 'https://api.trello.com/1',
      query: { key: this.appKey, token: this.token },
      json: true
    })
  }

  async fetchOrganizations(): Promise<TrelloOrganization[]> {
    const orgs = await this.client.get('/members/me/organizations')
    return orgs.body
  }

  async fetchBoards(): Promise<TrelloBoard[]> {
    const boards = await this.client.get('/members/me/boards')
    return boards.body
  }

  async fetchTags(boardId: string): Promise<TrelloLabel[]> {
    const labels = await this.client.get(`/boards/${boardId}/labels`, {
      query: { fields: 'all', limit: 50 }
    })

    return labels.body
  }
}

import got from 'got'
import debugFn from 'debug'
import {
  TrelloOrganization,
  TrelloBoard,
  TrelloLabel,
  TrelloList,
  TrelloCard,
  TrelloColor
} from './types'

const debug = debugFn('catalyst:trello')

export type TrelloListWithCards = TrelloList & {
  cards: TrelloCard[]
}

// https://developers.trello.com/reference#cards-2
export type CardRequest = {
  name: string
  desc: string
  idList: string

  pos?: 'top' | 'bottom' | number
  due?: Date
  dueComplete?: boolean
  idMembers?: string[]
  idLabels?: string[]
  urlSource?: string
}

export type LabelRequest = {
  name: string
  color: TrelloColor
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
    debug(`#fetchOrganizations`)

    const orgs = await this.client.get('/members/me/organizations')
    return orgs.body
  }

  async fetchBoards(): Promise<TrelloBoard[]> {
    debug(`#fetchBoards`)

    const boards = await this.client.get('/members/me/boards')
    return boards.body
  }

  async fetchLabels(boardId: string): Promise<TrelloLabel[]> {
    debug(`#fetchLabels board=${boardId}`)

    const labels = await this.client.get(`/boards/${boardId}/labels`, {
      query: { fields: 'all', limit: 50 }
    })

    return labels.body
  }

  async fetchLists(boardId: string): Promise<TrelloListWithCards[]> {
    debug(`#fetchLists board=${boardId}`)

    const lists = await this.client.get(`/boards/${boardId}/lists`, {
      query: { cards: 'open' }
    })

    return lists.body
  }

  async createLabel(
    boardId: string,
    request: LabelRequest
  ): Promise<TrelloLabel> {
    debug(`#createLabel board=${boardId} name=${request.name}`)

    const label = await this.client.post(`/boards/${boardId}/labels`, {
      body: request
    })

    return label.body
  }

  async createCard(boardId: string, request: CardRequest): Promise<TrelloCard> {
    debug(`#createCard board=${boardId} name=${request.name}`)

    const card = await this.client.post(`/cards`, {
      body: request
    })

    return card.body
  }
}

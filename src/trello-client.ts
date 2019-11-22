import got from 'got'
import { TrelloOrganization, TrelloBoard, TrelloLabel } from './types'

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

  async fetchLabels(boardId: string): Promise<TrelloLabel[]> {
    const labels = await this.client.get(`/boards/${boardId}/labels`, {
      query: { fields: 'all', limit: 50 }
    })

    return labels.body
  }
}

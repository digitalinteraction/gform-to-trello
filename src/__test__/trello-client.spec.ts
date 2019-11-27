import { TrelloClient, LabelRequest, CardRequest } from '../trello-client'
import nock from 'nock'

const fakeAuth = {
  key: 'fake-api-key',
  token: 'fake-token'
}

describe('TrelloClient', () => {
  let trello: TrelloClient
  let trelloScope: nock.Scope

  beforeEach(() => {
    trelloScope = nock('https://api.trello.com/1')
    trello = new TrelloClient('fake-api-key', 'fake-token')
  })

  describe('#constructor', () => {
    it('should create a got client', () => {
      expect(trello.client).toBeDefined()
    })
  })
  describe('#fetchOrganizations', () => {
    it('should call GET: /members/me/organizations', async () => {
      trelloScope
        .get('/members/me/organizations')
        .query(fakeAuth)
        .reply(200, [{ id: 1, name: 'some-fake-organization' }])

      const orgs = await trello.fetchOrganizations()

      expect(orgs).toContainEqual({
        id: 1,
        name: 'some-fake-organization'
      })
    })
  })
  describe('#fetchBoards', () => {
    it('should call GET: /members/me/boards', async () => {
      trelloScope
        .get('/members/me/boards')
        .query(fakeAuth)
        .reply(200, [{ id: 1, name: 'some-fake-board' }])

      const orgs = await trello.fetchBoards()

      expect(orgs).toContainEqual({
        id: 1,
        name: 'some-fake-board'
      })
    })
  })
  describe('#fetchLabels', () => {
    it('should call GET: /boards/:boardId/labels', async () => {
      trelloScope
        .get('/boards/some-board-id/labels')
        .query(fakeAuth)
        .reply(200, [{ id: 1, name: 'some-fake-label' }])

      const orgs = await trello.fetchLabels('some-board-id')

      expect(orgs).toContainEqual({
        id: 1,
        name: 'some-fake-label'
      })
    })
  })
  describe('#fetchLists', () => {
    it('should call GET: /boards/:boardId/lists', async () => {
      trelloScope
        .get('/boards/some-board-id/lists')
        .query({ ...fakeAuth, cards: 'open' })
        .reply(200, [{ id: 1, name: 'some-fake-board' }])

      const orgs = await trello.fetchLists('some-board-id')

      expect(orgs).toContainEqual({
        id: 1,
        name: 'some-fake-board'
      })
    })
  })
  describe('#createLabel', () => {
    it('should call POST: /boards/:boardId/labels', async () => {
      const fakeNewLabel = { id: 1, name: 'some-fake-label' }

      trelloScope
        .post('/boards/some-board-id/labels', body => {
          return body.name === 'new-label' && body.color === 'red'
        })
        .query(fakeAuth)
        .reply(200, fakeNewLabel)

      const label = await trello.createLabel('some-board-id', {
        name: 'new-label',
        color: 'red'
      })

      expect(label).toEqual(fakeNewLabel)
    })
  })
  describe('#createCard', () => {
    it('should call POST: /cards', async () => {
      const fakeNewCard = { id: 1, name: 'some-fake-card' }

      trelloScope
        .post('/cards', ({ name, desc, idList }) => {
          return (
            name === 'new-card' &&
            desc === 'a new card' &&
            idList === 'some-list-id'
          )
        })
        .query(fakeAuth)
        .reply(200, fakeNewCard)

      const card = await trello.createCard({
        name: 'new-card',
        desc: 'a new card',
        idList: 'some-list-id'
      })

      expect(card).toEqual(fakeNewCard)
    })
  })
})

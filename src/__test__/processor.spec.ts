import {
  parseResponse,
  findLabels,
  SimpleTrelloLabel,
  generateCardFromFormResponse,
  NewCard,
  createCardAndMatchLabels
} from '../processor'
import {
  FormResponse,
  FieldMapping,
  LabelMapping,
  MappingConfig,
  FieldResponse
} from '../types'

function makeResponse(value: string | string[]): FieldResponse {
  return {
    type: 'TEXT',
    index: 1,
    title: 'Sample field',
    value: value
  }
}

describe('#parseResponse', () => {
  it('should generate an object with field ids mapped to values', () => {
    const input: FormResponse = {
      123456: makeResponse('Hello, world!')
    }
    const mapping: FieldMapping = {
      123456: {
        path: 'message'
      }
    }

    const result = parseResponse(input, mapping)

    expect(result).toEqual({
      message: 'Hello, world!'
    })
  })

  it('should write nested values', () => {
    const input: FormResponse = {
      123456: makeResponse('Hello, world!')
    }
    const mapping: FieldMapping = {
      123456: {
        path: 'message.text'
      }
    }

    const result = parseResponse(input, mapping)

    expect(result).toEqual({
      message: {
        text: 'Hello, world!'
      }
    })
  })

  it('should handle array values', () => {
    const input: FormResponse = {
      123456: makeResponse(['Hello world!', 'My name is Geoff'])
    }
    const mapping: FieldMapping = {
      123456: {
        path: 'message'
      }
    }

    const result = parseResponse(input, mapping)

    expect(result).toEqual({
      message: ['Hello world!', 'My name is Geoff']
    })
  })

  it('should default to null if not set', () => {
    const input: FormResponse = {}

    const mapping: FieldMapping = {
      123456: {
        path: 'message'
      }
    }

    const result = parseResponse(input, mapping)

    expect(result).toEqual({
      message: null
    })
  })
})

describe('#findLabels', () => {
  it('should return new labels to create', () => {
    const response = {
      themes: ['Astronomy & Physics']
    }
    const labelMapping: LabelMapping = {
      themes: { prefix: 'topic', color: 'red' }
    }
    const trelloLabels: SimpleTrelloLabel[] = []

    const result = findLabels(response, labelMapping, trelloLabels)

    expect(result).toContainEqual({
      type: 'create',
      name: 'topic:astronomy-and-physics',
      color: 'red'
    })
  })
  it('should return labels to link', () => {
    const response = {
      themes: ['Astronomy & Physics']
    }
    const labelMapping: LabelMapping = {
      themes: { prefix: 'topic', color: 'red' }
    }
    const trelloLabels: SimpleTrelloLabel[] = [
      { id: 'abcdef', name: 'topic:astronomy-and-physics' }
    ]

    const result = findLabels(response, labelMapping, trelloLabels)

    expect(result).toContainEqual({
      type: 'link',
      id: 'abcdef'
    })
  })
})

describe('#generateCardFromFormResponse', () => {
  it('should return a card to be created', () => {
    const response: FormResponse = {
      1234: makeResponse('Some title'),
      5678: makeResponse(['Topic A', 'Topic B', 'Topic C'])
    }

    const config: MappingConfig = {
      titleKey: 'title',
      fields: {
        1234: {
          path: 'title'
        },
        5678: {
          path: 'themes'
        }
      },
      labels: {
        themes: { prefix: 'theme', color: 'red' }
      }
    }

    const trelloLabels: SimpleTrelloLabel[] = [
      { id: 'topic-a', name: 'theme:topic-a' }
    ]

    const renderer = jest.fn(() => 'rendered_content')

    const result = generateCardFromFormResponse(
      response,
      config,
      trelloLabels,
      renderer
    )

    expect(result).toEqual({
      title: 'Some title',
      body: 'rendered_content',
      labels: expect.any(Array)
    })

    expect(renderer).toBeCalledWith({
      data: {
        title: 'Some title',
        themes: ['Topic A', 'Topic B', 'Topic C']
      }
    })

    expect(result.labels).toContainEqual({ type: 'link', id: 'topic-a' })
    expect(result.labels).toContainEqual({
      type: 'create',
      name: 'theme:topic-b',
      color: 'red'
    })
    expect(result.labels).toContainEqual({
      type: 'create',
      name: 'theme:topic-c',
      color: 'red'
    })
  })
})

describe('#createCardAndMatchLabels', () => {
  let trello: any
  beforeEach(() => {
    trello = {
      createLabel: jest.fn(() => ({ id: 'created-label-id' })),
      createCard: jest.fn()
    }
  })

  it('should create labels marked "create"', async () => {
    const card: NewCard = {
      title: 'Some project',
      body: 'Some body content',
      labels: [
        { type: 'create', name: 'theme:topic-a', color: 'green' },
        { type: 'link', id: 'existing-label-id' }
      ]
    }
    const boardId = 'board_id'
    const listId = 'list_id'

    const result = await createCardAndMatchLabels(card, trello, boardId, listId)

    expect(trello.createLabel).toBeCalledWith('board_id', {
      name: 'theme:topic-a',
      color: 'green'
    })
  })

  it('should create a new card with created and linked labels', async () => {
    const card: NewCard = {
      title: 'Some project',
      body: 'Some body content',
      labels: [
        { type: 'create', name: 'theme:topic-a', color: 'green' },
        { type: 'link', id: 'existing-label-id' }
      ]
    }
    const boardId = 'board_id'
    const listId = 'list_id'

    const result = await createCardAndMatchLabels(card, trello, boardId, listId)

    expect(trello.createCard).toBeCalledWith({
      name: 'Some project',
      desc: 'Some body content',
      idList: 'list_id',
      idLabels: ['existing-label-id', 'created-label-id']
    })
  })
})

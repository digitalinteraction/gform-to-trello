import {
  parseResponse,
  FormResponse,
  FieldMapping,
  LabelMapping,
  findLabels,
  SimpleTrelloLabel,
  MappingConfig,
  createCardFromFormResponse
} from '../processor'

describe('#parseResponse', () => {
  it('should generate an object with field ids mapped to values', () => {
    const input: FormResponse = {
      123456: ['Hello, world!']
    }
    const mapping: FieldMapping = {
      123456: {
        path: 'message',
        type: 'text'
      }
    }

    const result = parseResponse(input, mapping)

    expect(result).toEqual({
      message: 'Hello, world!'
    })
  })

  it('should write nested values', () => {
    const input: FormResponse = {
      123456: ['Hello, world!']
    }
    const mapping: FieldMapping = {
      123456: {
        path: 'message.text',
        type: 'text'
      }
    }

    const result = parseResponse(input, mapping)

    expect(result).toEqual({
      message: {
        text: 'Hello, world!'
      }
    })
  })

  it('should process csv to arrays of trimmed strings', () => {
    const input: FormResponse = {
      123456: ['Hello world!, My name is Geoff']
    }
    const mapping: FieldMapping = {
      123456: {
        path: 'message',
        type: 'csv'
      }
    }

    const result = parseResponse(input, mapping)

    expect(result).toEqual({
      message: ['Hello world!', 'My name is Geoff']
    })
  })
})

describe('#findLabels', () => {
  it('should return new labels to create', () => {
    const response = {
      themes: ['Astronomy & Physics']
    }
    const labelMapping: LabelMapping = {
      themes: { prefix: 'topic' }
    }
    const trelloLabels: SimpleTrelloLabel[] = []

    const result = findLabels(response, labelMapping, trelloLabels)

    expect(result).toContainEqual({
      type: 'create',
      name: 'topic:astronomy-and-physics'
    })
  })
  it('should return labels to link', () => {
    const response = {
      themes: ['Astronomy & Physics']
    }
    const labelMapping: LabelMapping = {
      themes: { prefix: 'topic' }
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

describe('#createCardFromFormResponse', () => {
  it('should return a card to be created', () => {
    const response: FormResponse = {
      1234: ['Some title'],
      5678: ['Topic A, Topic B, Topic C']
    }

    const config: MappingConfig = {
      titleKey: 'title',
      fields: {
        1234: {
          path: 'title',
          type: 'text'
        },
        5678: {
          path: 'themes',
          type: 'csv'
        }
      },
      labels: {
        themes: { prefix: 'theme' }
      }
    }

    const trelloLabels: SimpleTrelloLabel[] = [
      { id: 'topic-a', name: 'theme:topic-a' }
    ]

    const renderer = jest.fn(() => 'rendered_content')

    const result = createCardFromFormResponse(
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
      name: 'theme:topic-b'
    })
    expect(result.labels).toContainEqual({
      type: 'create',
      name: 'theme:topic-c'
    })
  })
})

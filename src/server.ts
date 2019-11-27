import express from 'express'
import debugFn from 'debug'
import validateEnv from 'valid-env'
import { FormResponseStruct } from './structs'
import { TrelloClient } from './trello-client'
import {
  loadTemplate,
  loadMapping,
  generateCardFromFormResponse,
  createCardAndMatchLabels,
  NewCard
} from './processor'
import { Template } from 'nunjucks'
import { MappingConfig } from './types'

const debug = debugFn('catalyst:server')

export type RunArgs = {
  port: number
}

export function formHookMiddleware(
  contentTemplate: Template,
  mappingConfig: MappingConfig,
  trello: TrelloClient,
  boardId: string,
  inboxId: string
) {
  return async (req: express.Request, res: express.Response) => {
    try {
      const { response = {}, token = null } = req.body

      if (token !== process.env.HOOK_SECRET) {
        return res.status(401).send('Bad authentication')
      }

      const labels = await trello.fetchLabels(boardId)

      FormResponseStruct.assert(response)

      let card = generateCardFromFormResponse(
        response,
        mappingConfig,
        labels,
        data => contentTemplate.render(data)
      )

      const newCard = await createCardAndMatchLabels(
        card,
        trello,
        boardId,
        inboxId
      )

      return res.send(newCard)
    } catch (error) {
      console.log(error.message)
      return res.status(400).send('Failed')
    }
  }
}

export async function createServer(args: RunArgs) {
  debug('#createServer')

  validateEnv([
    'TRELLO_APP_KEY',
    'TRELLO_TOKEN',
    'TRELLO_BOARD_ID',
    'TRELLO_INBOX_LIST_ID',
    'HOOK_SECRET'
  ])

  const boardId = process.env.TRELLO_BOARD_ID!
  const inboxId = process.env.TRELLO_INBOX_LIST_ID!

  const trello = new TrelloClient(
    process.env.TRELLO_APP_KEY!,
    process.env.TRELLO_TOKEN!
  )

  const contentTemplate = await loadTemplate('res/content.njk')
  const mappingConfig = await loadMapping('res/mapping.yml')

  let app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.get('/health', (req, res) => res.send('ok'))

  app.use(
    formHookMiddleware(contentTemplate, mappingConfig, trello, boardId, inboxId)
  )

  return app
}

export async function runServer(args: RunArgs) {
  debug('#runServer')

  try {
    const app = await createServer(args)

    await new Promise(resolve => app.listen(3000, resolve))
    console.log('Listening on :3000')
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

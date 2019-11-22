import express from 'express'
import debugFn from 'debug'
import validateEnv from 'valid-env'
import { FormResponseStruct } from './structs'
import { TrelloClient } from './trello-client'
import {
  loadTemplate,
  loadMapping,
  createCardFromFormResponse
} from './processor'
import { join } from 'path'

const debug = debugFn('catalyst:server')

export type RunArgs = {
  port: number
}

export async function runServer(args: RunArgs) {
  debug('#runServer')

  validateEnv([
    'TRELLO_APP_KEY',
    'TRELLO_TOKEN',
    'TRELLO_BOARD_ID',
    'HOOK_SECRET'
  ])

  const trello = new TrelloClient(
    process.env.TRELLO_APP_KEY!,
    process.env.TRELLO_TOKEN!
  )

  try {
    let app = express()

    const contentTemplate = await loadTemplate('res/content.njk')
    const mappingConfig = await loadMapping('res/mapping.yml')

    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    app.get('/health', (req, res) => res.send('ok'))

    app.use(async (req, res) => {
      try {
        const { response = {}, token = null } = req.body

        if (token !== process.env.HOOK_SECRET) {
          return res.status(401).send('Bad authentication')
        }

        const labels = await trello.fetchLabels(process.env.TRELLO_BOARD_ID!)

        FormResponseStruct.assert(response)

        let card = createCardFromFormResponse(
          response,
          mappingConfig,
          labels,
          data => contentTemplate.render(data)
        )

        return res.send(card)
      } catch (error) {
        console.log(error.message)
        return res.status(400).send('Failed')
      }
    })

    await new Promise(resolve => app.listen(3000, resolve))
    console.log('Listening on :3000')
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

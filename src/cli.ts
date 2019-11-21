#!/usr/bin/env sh

import yargs from 'yargs'
import querystring from 'querystring'
import chalk from 'chalk'

import { validateEnv } from 'valid-env'
import { TrelloClient } from './trello-client'

function makeTrelloClient() {
  validateEnv(['TRELLO_APP_KEY', 'TRELLO_TOKEN'])

  return new TrelloClient(
    process.env.TRELLO_APP_KEY!,
    process.env.TRELLO_TOKEN!
  )
}

yargs.help().alias('h', 'help')

yargs.command(
  'trello:boards',
  'Get boards and their ids',
  yargs => yargs,
  async argv => {
    const client = makeTrelloClient()
    const orgs = await client.fetchOrganizations()
    const boards = await client.fetchBoards()

    let orgNames = new Map<string, string>()
    for (let org of orgs) orgNames.set(org.id, org.displayName)

    console.log(`Found ${boards.length} boards`)

    for (let board of boards) {
      if (board.closed) continue

      console.log(
        `-`,
        chalk.green(board.id),
        board.name,
        chalk.grey(orgNames.get(board.idOrganization) || 'Personal')
      )
    }
  }
)

yargs.command(
  'trello:tags [boardId]',
  'Fetch tags from the trello board',
  yargs =>
    yargs.positional('boardId', {
      type: 'string',
      describe: 'The id of the board to get tags from',
      default: process.env.TRELLO_BOARD_ID
    }),
  async argv => {
    if (!argv.boardId) throw new Error("'boardId' not passed")

    const client = makeTrelloClient()
    const tags = await client.fetchTags(argv.boardId)

    console.log(tags)
  }
)

yargs.command(
  'trello:auth [appKey]',
  'Authenticate with trello',
  yargs =>
    yargs.positional('appKey', {
      type: 'string',
      describe: 'Your trello app key, from https://trello.com/app-key',
      default: process.env.TRELLO_APP_KEY
    }),
  argv => {
    if (!argv.appKey) throw new Error('No appKey provided')

    let url =
      'https://trello.com/1/authorize?' +
      querystring.stringify({
        expiration: 'never',
        scope: 'read,write,account',
        response_type: 'token',
        name: 'Not-Equal Catalyst',
        key: argv.appKey
      })

    console.log(`Open ${url}`)
    console.log('To get your token')
  }
)

yargs.command(
  '$0',
  false,
  yargs => yargs,
  args => {
    const cmd = args._.join(' ').trim()
    console.log('Unknown command' + (cmd ? `: "${cmd}"` : ''))
    process.exit(1)
  }
)

yargs.parse()

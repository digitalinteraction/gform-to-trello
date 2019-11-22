#!/usr/bin/env sh

import yargs from 'yargs'
import querystring from 'querystring'
import chalk from 'chalk'
import debugFn from 'debug'

import { validateEnv } from 'valid-env'
import { TrelloClient } from './trello-client'
import { runServer } from './server'

const debug = debugFn('catalyst:cli')

// type Block<T extends any[], U extends any> = (...args: T) => U

// function wrapper<T extends any[], U extends any>(
//   name: string,
//   block: Block<T, U>
// ): Block<T, U> {
//   return (...args: T) => {
//     try {
//       debug(name)
//       return block(...args)
//     } catch (error) {
//       console.log(error)
//       throw new Error(process.exit(1))
//     }
//   }
// }

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
  yargs => yargs.option('showClosed', { type: 'boolean', default: false }),
  async argv => {
    debug('trello:boards')

    const client = makeTrelloClient()
    const orgs = await client.fetchOrganizations()
    const allBoards = await client.fetchBoards()

    const filteredBoards = allBoards.filter(b => !b.closed || argv.showClosed)

    let orgNames = new Map<string, string>()
    for (let org of orgs) orgNames.set(org.id, org.displayName)

    console.log(`Found ${filteredBoards.length} boards`)

    for (let board of filteredBoards) {
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
    debug('trello:tags')

    if (!argv.boardId) throw new Error("'boardId' not passed")

    const client = makeTrelloClient()
    const tags = await client.fetchLabels(argv.boardId)

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
    debug('trello:auth')

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
  'server [port]',
  'Run the server',
  yargs =>
    yargs.positional('port', {
      type: 'number',
      describe: 'The port to run on',
      default: 3000
    }),
  argv => {
    debug('server')
    runServer(argv)
  }
)

yargs.command(
  '$0',
  false,
  yargs => yargs,
  args => {
    const cmd = args._.join(' ').trim()

    if (cmd) console.log(`Unknown command '${cmd}'`)
    else console.log('No command entered')

    yargs.showHelp()
    process.exit(1)
  }
)

yargs.parse()

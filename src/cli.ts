#!/usr/bin/env sh

import yargs from 'yargs'
import querystring from 'querystring'
import chalk from 'chalk'
import debugFn from 'debug'
import fs from 'fs-extra'

import { validateEnv } from 'valid-env'
import { TrelloClient } from '@openlab/trello-client'
import { runServer } from './server'
import { TrelloColor } from './structs'
import { loadTemplate, renderTemplate } from './processor'

const debug = debugFn('catalyst:cli')

type Block<T extends any[], U extends any> = (...args: T) => U

function wrap<T extends any[], U extends any>(
  name: string,
  block: Block<T, U>
): Block<T, U> {
  return (...args: T) => {
    try {
      debug(name)
      return block(...args)
    } catch (error) {
      console.log(error)
      throw new Error(process.exit(1))
    }
  }
}

function foundMessage(value: any[], thing: string, prefix = 'Found ') {
  return `${prefix}${value.length} ${thing}${value.length !== 1 ? 's' : ''}`
}

function makeTrelloClient() {
  validateEnv(['TRELLO_APP_KEY', 'TRELLO_TOKEN'])

  return new TrelloClient(
    process.env.TRELLO_APP_KEY!,
    process.env.TRELLO_TOKEN!
  )
}

function addBoardId<T>(yargs: yargs.Argv<T>, info: string) {
  return yargs.positional('boardId', {
    type: 'string',
    describe: info,
    default: process.env.TRELLO_BOARD_ID
  })
}

yargs.help().alias('h', 'help')

yargs.command(
  'trello:boards',
  'Get boards and their ids',
  yargs => yargs.option('showClosed', { type: 'boolean', default: false }),
  wrap('trello:boards', async argv => {
    const client = makeTrelloClient()
    const orgs = await client.fetchOrganizations()
    const allBoards = await client.fetchBoards()

    const filteredBoards = allBoards.filter(b => !b.closed || argv.showClosed)

    let orgNames = new Map<string, string>()
    for (let org of orgs) orgNames.set(org.id, org.displayName)

    console.log(foundMessage(filteredBoards, 'label'))

    for (let board of filteredBoards) {
      console.log(
        `-`,
        chalk.green(board.id),
        board.name,
        chalk.grey(orgNames.get(board.idOrganization) || 'Personal')
      )
    }
  })
)

yargs.command(
  'trello:labels [boardId]',
  'Fetch labels from the trello board',
  yargs => {
    return addBoardId(yargs, 'The id of the board to get tags from')
  },
  wrap('trello:labels', async argv => {
    if (!argv.boardId) throw new Error("'boardId' not passed")

    const client = makeTrelloClient()
    const labels = await client.fetchLabels(argv.boardId)

    console.log(foundMessage(labels, 'label'))

    for (let label of labels) {
      console.log(
        `-`,
        chalk.green(label.id),
        label.name || chalk.yellow('<no_name>'),
        chalk.grey(label.color)
      )
    }
  })
)

yargs.command(
  'trello:lists [boardId]',
  'Fetch the lists on a trello board',
  yargs => {
    return addBoardId(yargs, 'The id of the board to get lists from')
  },
  wrap('trello:lists', async argv => {
    if (!argv.boardId) throw new Error("'boardId' not passed")

    const client = makeTrelloClient()
    const lists = await client.fetchLists(argv.boardId)

    console.log(foundMessage(lists, 'list'))

    for (let list of lists) {
      console.log(
        '-',
        chalk.green(list.id),
        list.name,
        chalk.grey(foundMessage(list.cards, 'card', ''))
      )
    }
  })
)

yargs.command(
  'trello:new:label <name> <color> [boardId]',
  'Add a label',
  yargs => {
    return addBoardId(yargs, 'The id of the board to get lists from')
      .positional('name', { type: 'string' })
      .positional('color', { type: 'string' })
  },
  wrap('trello:new:label', async argv => {
    if (!argv.boardId) throw new Error("'boardId' not passed")

    const [colorErr] = TrelloColor.validate(argv.color)
    if (colorErr) throw new Error('Invalid color')

    const client = makeTrelloClient()
    const label = await client.createLabel(argv.boardId, {
      name: argv.name!,
      color: argv.color! as any
    })

    console.log(label)
  })
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
  wrap('trello:auth', async argv => {
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
  })
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
  wrap('server', async argv => {
    debug('server')
    runServer(argv)
  })
)

//
// I'm not sure what would be useful to test about the mapping
// Maybe instead it could be an interactive generator instead, from the log comment
//
// yargs.command(
//   'test:mapping [mappingFile]',
//   'Test your mapping.yml file',
//   yargs =>
//     yargs.positional('mappingFile', {
//       type: 'string',
//       describe: 'The path to your mapping.yml',
//       default: 'res/mapping.yml'
//     }),
//   wrap('test:mapping', async ({ mappingFile }) => {
//     console.log('WIP', { mappingFile })
//   })
// )

yargs.command(
  'test:content [dataFile] [contentFile]',
  'Test your content.njk file',
  yargs =>
    yargs
      .positional('dataFile', {
        type: 'string',
        describe: 'The path to a json file to pipe into content.njk',
        default: 'res/dummy-content.json'
      })
      .positional('contentFile', {
        type: 'string',
        describe: 'The path to your content.njk',
        default: 'res/content.njk'
      }),
  wrap('test:content', async ({ dataFile, contentFile }) => {
    const data = fs.readJSONSync(dataFile)

    const template = await loadTemplate(contentFile)

    const output = await renderTemplate(template, { data })

    console.log(output)
  })
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

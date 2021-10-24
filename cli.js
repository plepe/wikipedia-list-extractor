#!/usr/bin/env node
const fs = require('fs')
const yaml = require('yaml')

require('./node')

const MediawikiListExtractor = require('./src/MediawikiListExtractor.js')

const ArgumentParser = require('argparse').ArgumentParser
const parser = new ArgumentParser({
  addHelp: true,
  description: 'Read entries from Wikipedia lists'
})

parser.addArgument(['-l', '--list'], {
  help: 'Which Wikipedia list to query. See data/ for available lists.',
  default: 'AT-BDA'
})

parser.addArgument(['-p', '--page'], {
  help: 'List all items from the specified page',
  default: null
})

parser.addArgument('id', {
  help: 'An ID (or several) to query from a Wikipedia list and print results.',
  nargs: '*'
})

const args = parser.parseArgs()

const listId = (args.list || 'AT-BDA')
let def = fs.readFileSync('data/' + listId + '.yaml')
def = yaml.parse(def.toString())

const list = new MediawikiListExtractor(listId, def)
if (args.page) {
  list.getPageItems(args.page, (err, result) => {
    if (err) { return console.error(err) }

    console.log(JSON.stringify(result, null, '    '))
  })
} else {
  list.get(args.id, (err, result) => {
    if (err) { return console.error(err) }

    console.log(JSON.stringify(result, null, '    '))
  })
}

#!/usr/bin/env node
const fs = require('fs')

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

parser.addArgument('id', {
  help: 'An ID (or several) to query from a Wikipedia list and print results.',
  nargs: '+'
})

const args = parser.parseArgs()

const listId = (args.list || 'AT-BDA')
let def = fs.readFileSync('data/' + listId + '.json')
def = JSON.parse(def)

const list = new MediawikiListExtractor(listId, def)
list.get(args.id, {}, (err, result) => {
  if (err) { return console.error(err) }

  console.log(JSON.stringify(result, null, '    '))
})

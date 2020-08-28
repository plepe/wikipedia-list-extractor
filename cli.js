#!/usr/bin/env node
const fs = require('fs')

global.fetch = require('node-fetch')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.document = dom.window.document

const MediawikiListExtractor = require('./src/MediawikiListExtractor.js')

const ArgumentParser = require('argparse').ArgumentParser
const parser = new ArgumentParser({
  addHelp: true,
  description: 'Read entries from Wikipedia lists'
})

parser.addArgument(['-l', '--list'], {
  help: 'Which Wikipedia list to query. See data/ for available lists.',
  default: 'bda'
})

parser.addArgument('id', {
  help: 'An ID (or several) to query from a Wikipedia list and print results.',
  nargs: '+'
})

const args = parser.parseArgs()

let def = fs.readFileSync('data/' + (args.list || 'bda') + '.json')
def = JSON.parse(def)

let list = new MediawikiListExtractor(def)
list.get(args.id, {}, (err, result) => {
  console.log(JSON.stringify(result, null, '    '))
})

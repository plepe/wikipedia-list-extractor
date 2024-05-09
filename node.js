import fetch from 'node-fetch'
global.fetch = fetch
import jsdom from 'jsdom'
const { JSDOM } = jsdom
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.document = dom.window.document

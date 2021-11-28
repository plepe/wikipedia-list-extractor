// compatibilty NodeJS < 11.0
require('array.prototype.flat').shim();

global.fetch = require('node-fetch')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.document = dom.window.document

/* global describe, it */

const fs = require('fs')
const assert = require('assert').strict

const ApiServer = require('./src/FakeServer')
const loadExtractor = require('../src/loadExtractor')
const MediawikiListExtractorClient = require('../src/Client')

const conf = JSON.parse(fs.readFileSync('test/conf.json'))
const def = JSON.parse(fs.readFileSync('test/def.json'))
conf.origSource = def.param.source
def.param.source = conf.url

let apiServer
let wikipediaList

describe('MediawikiListExtractor/Client', () => {
  it('start api server', (done) => {
    apiServer = new ApiServer(conf)
    apiServer.start(done)
  })

  it('initialize extractor', (done) => {
    loadExtractor('test', def, () => {
      wikipediaList = new MediawikiListExtractorClient('test', {serverUrl: conf.url})
      done()
    })
  })

  it('search a existing id', (done) => {
    wikipediaList.get(['126450'], {},
      (err, result) => {
        assert.equal(Object.keys(result).length, 1, 'should return one result')
        assert.equal(result['126450'].id, '126450')

        done()
      }
    )
  })

  /*
  it('search all elements of a page', (done) => {
    wikipediaList.getPageItems('Liste der denkmalgeschützten Objekte in Achau', {},
      (err, result) => {
        assert.equal(Object.keys(result).length, 9, 'should return 9 results')
        assert.equal(result['126450'].id, '126450')

        done()
      }
    )
  })
  */

  it('stop api wikipedia server', (done) => {
    apiServer.stop(done)
  })
})

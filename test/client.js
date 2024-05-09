/* global describe, it */

import fs from 'fs'
import { strict as assert } from 'assert'

import ApiServer from './src/FakeServer.js'
import loadExtractor from '../src/loadExtractor.js'
import MediawikiListExtractorClient from '../src/MediawikiListExtractorClient.js'

const conf = JSON.parse(fs.readFileSync('test/conf.json'))
const def = JSON.parse(fs.readFileSync('test/def.json'))
conf.origSource = def.param.source
def.param.source = conf.url

let apiServer
let wikipediaList

describe('MediawikiListExtractor/Client', function () {
  it('start api server', function (done) {
    apiServer = new ApiServer(conf)
    apiServer.start(done)
  })

  it('initialize extractor', function (done) {
    loadExtractor('test', def, function () {
      wikipediaList = new MediawikiListExtractorClient('test', { serverUrl: conf.url })
      done()
    })
  })

  it('search a existing id', function (done) {
    wikipediaList.get(['126450'], {},
      (err, result) => {
        assert.equal(result.length, 1, 'should return one result')
        assert.equal(result[0].id, '126450')

        done()
      }
    )
  })

  /*
  it('search all elements of a page', function (done) {
    wikipediaList.getPageItems('Liste der denkmalgeschützten Objekte in Achau', {},
      (err, result) => {
        assert.equal(result.length, 9, 'should return 9 results')
        assert.equal(result[0].id, '126450')

        done()
      }
    )
  })
  */

  it('stop api wikipedia server', function (done) {
    apiServer.stop(done)
  })
})

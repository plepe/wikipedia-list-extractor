/* global describe, it */

const fs = require('fs')
const assert = require('assert').strict

const FakeServer = require('./src/FakeServer')
const MediawikiListExtractor = require('../src/MediawikiListExtractor')

const conf = JSON.parse(fs.readFileSync('test/conf.json'))
const def = JSON.parse(fs.readFileSync('test/def.json'))
conf.origSource = def.param.source
def.param.source = conf.url

let fakeServer
let wikipediaList

describe('MediawikiListExtractor', () => {
  it('start fake wikipedia server', (done) => {
    fakeServer = new FakeServer(conf)
    fakeServer.start(done)
  })

  it('initialize extractor', () => {
    wikipediaList = new MediawikiListExtractor('AT-BDA', def)
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

  it('search all elements of a page', (done) => {
    wikipediaList.getPageItems('Liste der denkmalgeschützten Objekte in Achau', {},
      (err, result) => {
        assert.equal(Object.keys(result).length, 9, 'should return 9 results')
        assert.equal(result['126450'].id, '126450')

        done()
      }
    )
  })

  it('stop fake wikipedia server', (done) => {
    fakeServer.stop(done)
  })
})

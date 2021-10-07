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

describe('MediawikiListExtractor', function () {
  it('start fake wikipedia server', function (done) {
    fakeServer = new FakeServer(conf)
    fakeServer.start(done)
  })

  it('initialize extractor', function () {
    wikipediaList = new MediawikiListExtractor('AT-BDA', def)
  })

  it('search an existing id', function (done) {
    wikipediaList.get(['126450'], {},
      (err, result) => {
        assert.equal(result.length, 1, 'should return one result')
        assert.equal(result[0].id, '126450')

        done()
      }
    )
  })

  it('search all elements of a page', function (done) {
    wikipediaList.getPageItems('Liste der denkmalgeschützten Objekte in Achau', {},
      function (err, result) {
        assert.equal(result.length, 9, 'should return 9 results')
        const itemIds = result.map(item => item.id).sort()
        assert.deepEqual(itemIds, ['10014', '111392', '126450', '1439', '1853', '20055', '53070', '77816', '77820'])

        done()
      }
    )
  })

  it('stop fake wikipedia server', function (done) {
    fakeServer.stop(done)
  })
})

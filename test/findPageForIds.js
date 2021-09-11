/* global describe, it */

const fs = require('fs')
const assert = require('assert').strict

const FakeServer = require('./src/FakeServer')
const findPageForIds = require('../src/findPageForIds')

const conf = JSON.parse(fs.readFileSync('test/conf.json'))
const def = JSON.parse(fs.readFileSync('test/def.json'))
conf.origSource = def.sources[0].source
def.sources[0].source = conf.url

let fakeServer

describe('processedItemGetId', () => {
  it('start fake wikipedia server', (done) => {
    fakeServer = new FakeServer(conf)
    fakeServer.start(done)
  })


  it('search for a page for an existing id', (done) => {
    findPageForIds(def.sources[0], ['126450'], {},
      (err, result) => {
        assert.equal(result, 'Liste der denkmalgeschützten Objekte in Achau')
        done()
      }
    )
  })

  it('search for a page for a non-existing id', (done) => {
    findPageForIds(def.sources[0], ['1234'], {},
      (err, result) => {
        assert.equal(result, null)
        done()
      }
    )
  })

  it('search for a page for several ids', (done) => {
    findPageForIds(def.sources[0], ['126450', '1234', '18831'], {},
      (err, result) => {
        assert.equal(result, 'Liste der denkmalgeschützten Objekte in Absam')
        done()
      }
    )
  })

  it('stop fake wikipedia server', (done) => {
    fakeServer.stop(done)
  })
})

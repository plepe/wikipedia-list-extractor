/* global describe, it */

const fs = require('fs')
const assert = require('assert').strict

const FakeServer = require('./src/FakeServer')
const findPagesForIds = require('../src/findPagesForIds')

const conf = JSON.parse(fs.readFileSync('test/conf.json'))
const def = JSON.parse(fs.readFileSync('test/def.json'))
conf.origSource = def.sources[0].source
def.sources[0].source = conf.url

let fakeServer

describe('findPagesForIds()', () => {
  it('start fake wikipedia server', (done) => {
    fakeServer = new FakeServer(conf)
    fakeServer.start(done)
  })


  it('search for a page for an existing id', (done) => {
    findPagesForIds(def.sources[0], ['126450'], {},
      (err, result) => {
        assert.deepEqual(result, ['Liste der denkmalgeschützten Objekte in Achau'])
        done(err)
      }
    )
  })

  it('search for a page for a non-existing id', (done) => {
    findPagesForIds(def.sources[0], ['1234'], {},
      (err, result) => {
        assert.deepEqual(result, [])
        done(err)
      }
    )
  })

  it('search for a page for several ids', (done) => {
    findPagesForIds(def.sources[0], ['126450', '1234', '18831'], {},
      (err, result) => {
        assert.deepEqual(result, ['Liste der denkmalgeschützten Objekte in Absam', 'Liste der denkmalgeschützten Objekte in Achau'])
        done(err)
      }
    )
  })

  it('stop fake wikipedia server', (done) => {
    fakeServer.stop(done)
  })
})

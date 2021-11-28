/* global describe, it */

const fs = require('fs')
const assert = require('assert').strict

// compatibilty NodeJS < 11.0
require('../node')

const FakeServer = require('./src/FakeServer')
const findPagesForIds = require('../src/findPagesForIds')

const conf = JSON.parse(fs.readFileSync('test/conf.json'))
const def = JSON.parse(fs.readFileSync('test/def.json'))
conf.origSource = def.param.source
def.param.source = conf.url

let fakeServer

describe('findPagesForIds()', function () {
  it('start fake wikipedia server', function (done) {
    fakeServer = new FakeServer(conf)
    fakeServer.start(done)
  })

  it('search for a page for an existing id', function (done) {
    findPagesForIds(def.param, ['126450'], {},
      (err, result) => {
        assert.deepEqual(result, ['Liste der denkmalgeschützten Objekte in Achau'])
        done(err)
      }
    )
  })

  it('search for a page for a non-existing id', function (done) {
    findPagesForIds(def.param, ['1234'], {},
      (err, result) => {
        assert.deepEqual(result, [])
        done(err)
      }
    )
  })

  it('search for a page for several ids', function (done) {
    findPagesForIds(def.param, ['126450', '1234', '18831'], {},
      (err, result) => {
        assert.deepEqual(result, ['Liste der denkmalgeschützten Objekte in Absam', 'Liste der denkmalgeschützten Objekte in Achau'])
        done(err)
      }
    )
  })

  it('stop fake wikipedia server', function (done) {
    fakeServer.stop(done)
  })
})

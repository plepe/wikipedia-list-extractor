/* global describe, it */
const fs = require('fs')
const assert = require('assert').strict

const findWikidataItems = require('../src/findWikidataItems')

describe('findWikidataItems()', function () {
  it('search for one item', function (done) {
    findWikidataItems([
      { P9154: '105934' }
    ],
    (err, result) => {
      assert.deepEqual(result[0], ['Q37806621'])
      done(err)
    })
  })

  it('search for one item with a link to another wikidata object', function (done) {
    findWikidataItems([
      { P1028: 'Q99619679' }
    ],
    (err, result) => {
      assert.deepEqual(result[0], ['Q99619614'])
      done(err)
    })
  })

  it('search for two items (same property)', function (done) {
    findWikidataItems([
      { P9154: '24538' },
      { P9154: '24536' }
    ],
    (err, result) => {
      assert.deepEqual(result[0], ['Q37884974'])
      assert.deepEqual(result[1], ['Q1534177'])
      done(err)
    })
  })

  it('search for two items on different properties', function (done) {
    findWikidataItems([
      { P4244: 'D-5-64-000-171' },
      { P8430: '47968' }
    ],
    function (err, result) {
      assert.deepEqual(result[0], ['Q41427878'])
      assert.deepEqual(result[1], ['Q1534177'])
      done(err)
    })
  })
})

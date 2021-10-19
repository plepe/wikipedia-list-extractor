/* global describe, it */
const fs = require('fs')
const assert = require('assert').strict

const findWikidataItems = require('../src/findWikidataItems')

describe('findWikidataItems()', function () {
  it('search for one item', function (done) {
    findWikidataItems([
      { wikidataProperty: 'P9154', wikidataValue: '105934' }
    ],
    (err, result) => {
      assert.equal(result[0].itemId, 'Q37806621')
      done(err)
    })
  })

  it('search for two items (same property)', function (done) {
    findWikidataItems([
      { wikidataProperty: 'P9154', wikidataValue: '24538' },
      { wikidataProperty: 'P9154', wikidataValue: '24536' }
    ],
    (err, result) => {
      assert.equal(result[0].itemId, 'Q37884974')
      assert.equal(result[1].itemId, 'Q1534177')
      done(err)
    })
  })

  it('search for two items one different properties', function (done) {
    findWikidataItems([
      { wikidataProperty: 'P4244', wikidataValue: 'D-5-64-000-171' },
      { wikidataProperty: 'P8430', wikidataValue: '47968' }
    ],
    (err, result) => {
      assert.equal(result[0].itemId, 'Q41427878')
      assert.equal(result[1].itemId, 'Q1534177')
      done(err)
    })
  })
})

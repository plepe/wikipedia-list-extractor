/* global describe, it */

const assert = require('assert').strict

const processedItemGetId = require('../src/processedItemGetId')

describe('processedItemGetId', () => {
  it('type "renderedIdField"', () => {
    const expected = '1234'

    const result = processedItemGetId(
      { renderedIdField: 'foo' },
      { foo: '1234', bar: 'test' }
    )

    assert.equal(result, expected)
  })
})

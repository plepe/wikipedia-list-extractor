/* global describe, it */

const assert = require('assert').strict

const renderedItemGetId = require('../src/renderedItemGetId')

describe('renderedItemGetId', function () {
  it('type "renderedIdField"', function () {
    const expected = '1234'

    const result = renderedItemGetId(
      { renderedIdField: 'foo' },
      { foo: '1234', bar: 'test' }
    )

    assert.equal(result, expected)
  })
})

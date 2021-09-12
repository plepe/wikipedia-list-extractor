/* global describe, it */
require('../node')

const assert = require('assert').strict
const fs = require('fs')

const parseRenderedPage = require('../src/parseRenderedPage')

const inputs = {
  Achau: fs.readFileSync('test/data/rendered/Achau.html')// .toString()
}

const expected = {
  Achau: JSON.parse(fs.readFileSync('test/data/rendered/Achau.json'))
}

const def = JSON.parse(fs.readFileSync('test/def.json')).sources[0]

describe('parseRenderedPage', () => {
  it('should return something', () => {
    const result = parseRenderedPage(def, inputs.Achau)
    assert.equal(result.length, expected.Achau.length, 'Same amount of items')

    for (let i = 0; i < result.length; i++) {
      assert.deepEqual(result[i], expected.Achau[i], 'Item ' + i + ' should equal')
    }
  })
})

//    fs.writeFileSync('test.json', JSON.stringify(result, null, '  '))

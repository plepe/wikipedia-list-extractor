/* global describe, it */
require('../node')

const assert = require('assert').strict
const fs = require('fs')

const parseProcessedPage = require('../src/parseProcessedPage')

const inputs = {
  Achau: fs.readFileSync('test/data/processed/Achau.html')// .toString()
}

const expected = {
  Achau: JSON.parse(fs.readFileSync('test/data/processed/Achau.json'))
}

const def = JSON.parse(fs.readFileSync('test/def.json')).sources[0]

describe('parseProcessedPage', () => {
  it('should return something', () => {
    const result = parseProcessedPage(def, inputs.Achau)
    assert.equal(result.length, expected.Achau.length, 'Same amount of items')

    for (let i = 0; i < result.length; i++) {
      assert.deepEqual(result[i], expected.Achau[i], 'Item ' + i + ' should equal')
    }
  })
})

//    fs.writeFileSync('test.json', JSON.stringify(result, null, '  '))

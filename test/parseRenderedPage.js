/* global describe, it */
import '../node.js'

import { strict as assert } from 'assert'
import fs from 'fs'

import parseRenderedPage from '../src/parseRenderedPage.js'

const inputs = {
  Achau: fs.readFileSync('test/data/rendered/Achau.html')// .toString()
}

const expected = {
  Achau: JSON.parse(fs.readFileSync('test/data/rendered/Achau.json'))
}

const def = JSON.parse(fs.readFileSync('test/def.json'))

describe('parseRenderedPage', function () {
  it('should return something', function () {
    const result = parseRenderedPage(def.param, inputs.Achau)
    assert.equal(result.length, expected.Achau.length, 'Same amount of items')

    for (let i = 0; i < result.length; i++) {
      assert.deepEqual(result[i], expected.Achau[i], 'Item ' + i + ' should equal')
    }
  })
})

//    fs.writeFileSync('test.json', JSON.stringify(result, null, '  '))

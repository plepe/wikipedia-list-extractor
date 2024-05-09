/* global describe, it */
require('../node')

const assert = require('assert').strict
const fs = require('fs')

const wikidata = require('../src/wikidata')

describe('wikidata', function () {
  it('P9154=108784', function (done) {
    wikidata.query(
      { P9154: '108784' },
      function (err, result) {
        assert.deepEqual(result, { Q37813444: {} })
        done()
      }
    )
  })

  it('P9154=108784 with label', function (done) {
    wikidata.query(
      { P9154: { type: 'string', value: '108784' } },
      { label: true },
      (err, result) => {
        assert.deepEqual(result, { Q37813444: { label: 'Bauernhof (Anlage), Einhof' } })
        done()
      }
    )
  })

  it('P9154=108784 with value of P2817', function (done) {
    this.timeout(5000)
    wikidata.query(
      { P9154: '108784' },
      { properties: ['P2817'] },
      (err, result) => {
        assert.deepEqual(result, { Q37813444: { P2817: { type: 'id', values: ['Q1556039'] } } })
        done()
      }
    )
  })

  it('P131=Q693620', function (done) {
    wikidata.query(
      { P131: { type: 'id', value: 'Q693620' } },
      (err, result) => {
        assert.deepEqual(result, { Q1746495: {}, Q1768615: {}, Q1857471: {}, Q14240346: {}, Q37840567: {}, Q37840609: {}, Q56238469: {}, Q96033190: {}, Q96033668: {}, Q96033744: {}, Q96033795: {}, Q96051187: {}, Q96051259: {}, Q96051473: {}, Q96052435: {}, Q97157570: {}, Q98092306: {}, Q98092453: {}, Q98092463: {}, Q98092475: {}, Q98092485: {}, Q98092580: {}, Q98092671: {}, Q98092686: {}, Q98092704: {}, Q98092783: {}, Q98092808: {}, Q98092823: {}, Q98092837: {}, Q98092848: {}, Q98092858: {}, Q98092869: {}, Q98092877: {}, Q98092886: {}, Q111167464: {}, Q112256828: {}, Q112256860: {}, Q112256880: {}, Q112340834: {}, Q112731080: {}, Q113087906: {}, Q120754226: {} })
        done()
      }
    )
  })

  it('P9154=24536, P186, P1619, P625, P31', function (done) {
    wikidata.query(
      { P9154: '24536' },
      { properties: ['P186', 'P1619', 'P625', 'P31', 'P1234', 'P6375', 'P9154'] },
      (err, result) => {
        assert.deepEqual(result, { Q1534177: { P186: { type: 'id', values: ['Q22731', 'Q34095'] }, P1619: { type: 'http://www.w3.org/2001/XMLSchema#dateTime', values: ['1900-12-15T00:00:00Z'] }, P625: { type: 'http://www.opengis.net/ont/geosparql#wktLiteral', values: ['Point(16.3662 48.2034)'] }, P31: { type: 'id', values: ['Q811979', 'Q4989906'] }, P6375: { type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString', values: ['vor Goethegasse 3'] }, P9154: { type: 'http://www.w3.org/2001/XMLSchema#string', values: ['24536'] } } })
        done()
      }
    )
  })

  it('P9154=24536, dewiki, commons', function (done) {
    wikidata.query(
      { P9154: '24536' },
      { articles: ['dewiki', 'commons'] },
      (err, result) => {
        assert.deepEqual(result, { Q1534177: { dewiki: { type: 'uri', value: 'https://de.wikipedia.org/wiki/Goethedenkmal_(Wien)' }, commons: { type: 'uri', value: 'https://commons.wikimedia.org/wiki/Category:Goethe_monument,_Vienna' } } })
        done()
      }
    )
  })
})

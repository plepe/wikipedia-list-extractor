const fs = require('fs')

const MediawikiListExtractor = require('./MediawikiListExtractor.js')

const extractors = {}

module.exports = function loadExtractor (id, callback) {
  if (extractors[id]) {
    return callback(null, extractors[id])
  }

  fs.readFile('data/' + id + '.json', (err, def) => {
    if (err) { return callback(err) }

    def = JSON.parse(def)

    extractors[id] = new MediawikiListExtractor(id, def)
    callback(null, extractors[id])
  })
}

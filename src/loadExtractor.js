const fs = require('fs')

const MediawikiListExtractor = require('./MediawikiListExtractor.js')

const extractors = {}

/**
 * @param {string} id - id of the extractor (e.g. "AT-BDA")
 * @param {object} [def] - override definition; if not, load from file
 * @param {function} callback - return the loaded extractor: (err, extractor)
 */
module.exports = function loadExtractor (id, def, callback=null) {
  if (typeof def === 'function') {
    callback = def
    def = null
  }

  if (extractors[id]) {
    return callback(null, extractors[id])
  }

  if (def) {
    extractors[id] = new MediawikiListExtractor(id, def)
    return callback(null, extractors[id])
  }

  fs.readFile('data/' + id + '.json', (err, def) => {
    if (err) { return callback(err) }

    def = JSON.parse(def)

    extractors[id] = new MediawikiListExtractor(id, def)
    callback(null, extractors[id])
  })
}
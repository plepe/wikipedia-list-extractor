const fs = require('fs')
const path = require('path')
const yaml = require('yaml')

const MediawikiListExtractor = require('./MediawikiListExtractor.js')

const extractors = {}

/**
 * @param {string} id - id of the extractor (e.g. "AT-BDA")
 * @param {object} [def] - override definition; if not, load from file
 * @param {function} callback - return the loaded extractor: (err, extractor)
 */
module.exports = function loadExtractor (id, def, callback = null) {
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

  fs.readFile(path.join(__dirname, '../data/' + id + '.yaml'), (err, def) => {
    if (err) { return callback(err) }

    def = yaml.parse(def.toString())

    extractors[id] = new MediawikiListExtractor(id, def)
    callback(null, extractors[id])
  })
}

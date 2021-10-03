const queryString = require('query-string')

const loadExtractor = require('./loadExtractor')

module.exports = function apiHandle (url, callback) {
  const m = url.match(/^\/api\/([A-Z-]*)\/([^?]+)(\?.*|)$/i)
  if (m) {
    const listId = m[1]
    const ids = m[2].split(/,/g)
    const param = queryString.parse(m[3])

    loadExtractor(listId, (err, extractor) => {
      if (err) {
        return callback(err)
      }

      extractor.get(ids, param, callback)
    })
  }
}

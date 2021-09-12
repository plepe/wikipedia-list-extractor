const fs = require('fs')
const http = require('http')
const queryString = require('query-string')

const loadExtractor = require('./loadExtractor')

module.exports = function apiHandle (url, callback) {
  const m = url.match(/^\/api\/([A-Z-]*)\/([^?]+)(\?.*|)$/)
  if (m) {
    const listId = m[1]
    const ids = m[2].split(/,/g)
    const param = queryString.parse(m[3])

    loadExtractor(listId, (err, extractor) => {
      if (err) {
        res.writeHead(500)
        res.end()
        return console.error(err)
      }

      extractor.get(ids, (err, result) => {
        if (err) {
          console.error(err)
          res.writeHead(500)
          res.end(err)
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.writeHead(200)
        res.end(JSON.stringify(result, null, '    '))
      })
    })

    return
  }
}

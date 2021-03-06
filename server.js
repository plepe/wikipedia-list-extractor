const http = require('http')
const fs = require('fs')
const path = require('path')
const queryString = require('query-string')

const proxy = require('./proxy/index.js')
const MediawikiListExtractor = require('./src/MediawikiListExtractor.js')

require('./node')

let extractors = {}
const options = {}

function loadExtractor (id, callback) {
  if (extractors[id]) {
    return callback(null, extractors[id])
  }

  fs.readFile('data/' + id + '.json', (err, def) => {
    if (err) { return callback(err) }

    def = JSON.parse(def)

    extractors[id] = new MediawikiListExtractor(id, def, options)
    callback(null, extractors[id])
  })
}

const files = [
  '/dist/app.js',
  '/index.html'
]
const contentTypes = {
  html: 'text/html',
  js: 'application/javascript',
  json: 'application/json'
}

function requestListener (req, res) {
  let file
  let ext = 'html'

  console.log('* ' + req.url)

  if (req.url === '/') {
    file = '/index.html'
  }

  if (files.includes(req.url) || req.url.match(/^\/data\/.*\.json$/)) {
    file = req.url
  }

  let m = req.url.match(/^\/proxy\/\?(.*)$/)
  if (m) {
    return proxy(queryString.parse(m[1]), (err, result) => {
      if (err) {
        res.writeHead(500)
        res.end('Internal server error')
        return console.error(err)
      }

      res.setHeader('Content-Type', 'text/html')
      res.writeHead(200)
      res.end(result)
    })
  }

  if (req.url === '/data/') {
    return fs.readdir('data/', (err, files) => {
      let text = '<ul>' +
        files.map(file => {
          if (file.match(/./)) {
            return '<li><a href="' + file + '">' + file + '</a></li>'
          }
        }).join('') +
        '</ul>'

      res.setHeader('Content-Type', 'text/html')
      res.writeHead(200)
      res.end(text)
    })
  }

  m = req.url.match(/\/api\/([A-Z-]*)\/([^?]+)(\?.*|)$/)
  if (m) {
    let listId = m[1]
    let ids = m[2].split(/,/g)
    let param = queryString.parse(m[3])

    loadExtractor(listId, (err, extractor) => {
      if (err) {
        res.writeHead(500)
        res.end()
        return console.error(err)
      }

      extractor.get(ids, (err, result) => {
        res.setHeader('Content-Type', 'application/json')
        res.writeHead(200)
        res.end(JSON.stringify(result, null, '    '))
      })
    })

    return
  }

  if (!file) {
    res.writeHead(404)
    res.end('File not found')
    return
  }

  fs.readFile(path.join(__dirname, file), (err, contents) => {
    const m = file.match(/\.([a-z]*)$/i)
    ext = m[1]

    if (err) {
      res.writeHead(500)
      res.end()
      return console.error(err)
    }

    res.setHeader('Content-Type', ext in contentTypes ? contentTypes[ext] : 'text/plain')
    res.writeHead(200)
    res.end(contents)
  })
}

const server = http.createServer(requestListener)
server.listen(8080)

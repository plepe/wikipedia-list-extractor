const http = require('http')
const fs = require('fs')
const path = require('path')
const queryString = require('query-string')

const proxy = require('./proxy/index.js')

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

  const m = req.url.match(/^\/proxy\/\?(.*)$/)
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

const http = require('http')
const fs = require('fs')
const path = require('path')
const queryString = require('query-string')

const proxy = require('./proxy/index.js')
const apiHandle = require('./src/apiHandle')

require('./node')

const files = [
  '/dist/app.js',
  '/index.html'
]
const contentTypes = {
  html: 'text/html',
  js: 'application/javascript',
  yaml: 'text/x-yaml',
  json: 'application/json'
}

function requestListener (req, res) {
  let file
  let ext = 'html'

  console.log('* ' + req.url)

  if (req.url === '/') {
    file = '/index.html'
  }

  if (files.includes(req.url) || req.url.match(/^\/data\/.*\.yaml$/)) {
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
      if (err) {
        return console.error(err)
      }

      const text = '<ul>' +
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

  m = req.url.match(/^\/api\//)
  if (m) {
    return apiHandle(req.url,
      (err, result) => {
        if (err) {
          console.error(err)
          res.writeHead(500)
          res.end(err)
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.writeHead(200)
        res.end(JSON.stringify(result, null, '    '))
      }
    )
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

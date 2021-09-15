const fs = require('fs')
const http = require('http')
const md5 = require('md5')

const apiHandle = require('../../src/apiHandle')

module.exports = class FakeServer {
  constructor (conf) {
    this.conf = conf
  }

  start (callback) {
    this.server = http.createServer((req, res) => this.requestListener(req, res))
    this.server.listen(this.conf.port)
    callback()
  }

  loadOriginalFile (url, callback) {
    let id = md5(url)
    let file = 'test/data/original/' + id

    fs.readFile(file,
      (err, text) => {
        if (err && err.code === 'ENOENT') {
          let origUrl = this.conf.origSource + url
          console.log('load original url', origUrl)

          global.fetch(origUrl)
            .then(req => req.text())
            .then(text => {
              console.log('saving result to', file)
              fs.writeFile(file, text, (err) => {
                if (err) {
                  return callback(err)
                }

                callback(null, text)
              })
            })

          return
        } else if (err) {
          return console.error(err)
        }

        callback(null, text)
      }
    )
  }

  requestListener (req, res) {
    console.log(req.url)
    if (req.url.match(/^\/api\//)) {
      return apiHandle(req.url, (err, result) => {
        if (err) {
          res.writeHead(500)
          res.end('Internal server error')
          return console.error(err)
        }

        res.setHeader('Content-Type', 'application/json')
        res.writeHead(200)
        res.end(JSON.stringify(result, null, '  '))
      })
    }

    this.loadOriginalFile(req.url,
      (err, result) => {
        if (err) {
          console.error(err)
        }

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(result)
      }
    )
  }

  stop (callback) {
    this.server.close()
    callback()
  }
}

const jsdom = require("jsdom")
const { JSDOM } = jsdom

const wikipediaGetImageProperties = require('./wikipediaGetImageProperties.js')

class MediawikiListExtractor {
  constructor (def) {
    this.def = def
  }

  loadPage (param, options, callback) {
    global.fetch('https://' + param.source + '/wiki/' + encodeURIComponent(param.title))
      .then(res => res.text())
      .then(body => callback(null, body))
  }

  get (ids, options, callback) {
    if (!Array.isArray(ids)) {
      ids = [ ids ]
    }

    let source = this.def.sources[0]

    let search = 'hastemplate:"' + source.template + '" insource:/' + source.template + '.*' + source.templateIdField + ' *= *(' + ids.join('|') + ')[^0-9]/ intitle:/' + source.pageTitleMatch + '/'

    global.fetch('https://' + source.source + '/w/index.php?search=' + encodeURIComponent(search))
      .then(res => res.text())
      .then(body => {
        const dom = new JSDOM(body)
        const articles = dom.window.document.querySelectorAll('li.mw-search-result > div > a')

        if (!articles.length) {
          return callback(null, [])
        }

        let page = articles[0].getAttribute('title')
        this.loadPage(
          {
            title: page,
            source: source.source
          },
          options,
          (err, body) => {
            const dom = new JSDOM(body)
            let result = []

            let remaining = ids.filter(id => {
              const tr = dom.window.document.getElementById(source.renderedTableRowPrefix + id)
              if (!tr) {
                return true
              }

              let data = {}

              Object.keys(source.renderedFields).forEach(fieldId => {
                const fieldDef = source.renderedFields[fieldId]

                const td = tr.cells[fieldDef.column]

                let value

                switch (fieldDef.type) {
                  case 'image':
                    let imgs = td.getElementsByTagName('img')
                    imgs = Array.from(imgs).filter(img => img.width > 64 && img.height > 64)
                    if (imgs.length) {
                      value = wikipediaGetImageProperties(imgs[0])
                    }
                    break
                  case 'html':
                  default:
                    value = td.innerHTML
                }

                data[fieldId] = value
              })

              result.push({ id, page, data })
            })

            if (remaining.length) {
              this.get(remaining, options, (err, r) => {
                if (err) { return callback(err) }

                result = result.concat(r)

                callback(null, result)
              })
            } else {
              callback(null, result)
            }
          }
        )
      })
  }
}

module.exports = MediawikiListExtractor

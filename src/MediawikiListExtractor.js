const wikipediaGetImageProperties = require('./wikipediaGetImageProperties.js')

class MediawikiListExtractor {
  constructor (def) {
    this.def = def
  }

  loadPage (param, options, callback) {
    let url = 'https://' + param.source + '/wiki/' + encodeURIComponent(param.title)
    if (options.proxy) {
      url = options.proxy + 'source=' + encodeURIComponent(param.source) + '&page=' + encodeURIComponent(param.title)
    }

    global.fetch(url)
      .then(res => res.text())
      .then(body => callback(null, body))
  }

  get (ids, options, callback) {
    if (!Array.isArray(ids)) {
      ids = [ids]
    }

    const source = this.def.sources[0]

    const search = 'hastemplate:"' + source.template + '" insource:/' + source.template + '.*' + source.templateIdField + ' *= *(' + ids.join('|') + ')[^0-9]/ intitle:/' + source.pageTitleMatch + '/'

    let url = 'https://' + source.source + '/w/index.php?search=' + encodeURIComponent(search)
    if (options.proxy) {
      url = options.proxy + 'source=' + encodeURIComponent(source.source) + '&search=' + encodeURIComponent(search)
    }

    global.fetch(url)
      .then(res => res.text())
      .then(body => {
        const dom = global.document.createElement('div')
        dom.innerHTML = body
        const articles = dom.querySelectorAll('li.mw-search-result > div > a')

        if (!articles.length) {
          return callback(null, [])
        }

        const page = articles[0].getAttribute('title')
        this.loadPage(
          {
            title: page,
            source: source.source
          },
          options,
          (err, body) => {
            if (err) { return callback(err) }

            const dom = global.document.createElement('div')
            dom.innerHTML = body
            let result = []

            const remaining = ids.filter(id => {
              const tr = dom.querySelector('#' + source.renderedTableRowPrefix + id)
              if (!tr) {
                return true
              }

              const data = {}

              Object.keys(source.renderedFields).forEach(fieldId => {
                const fieldDef = source.renderedFields[fieldId]

                const td = tr.cells[fieldDef.column]

                let value

                if (fieldDef.type === 'image') {
                  let imgs = td.getElementsByTagName('img')
                  imgs = Array.from(imgs).filter(img => img.width > 64 && img.height > 64)
                  if (imgs.length) {
                    value = wikipediaGetImageProperties(imgs[0])
                  }
                } else {
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

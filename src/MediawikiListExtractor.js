const wikipediaGetImageProperties = require('./wikipediaGetImageProperties.js')
const updateLinks = require('./updateLinks.js')

class MediawikiListExtractor {
  constructor (id, def) {
    this.id = id
    this.def = def
    this.cache = {}
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
  
  parsePage (source, page, body) {
    const dom = global.document.createElement('div')
    dom.innerHTML = body

    const table = dom.getElementsByClassName(source.renderedTableClass)[0]

    const trs = Array.from(table.rows)

    trs.forEach(tr => {
      const m = tr.id.match(new RegExp('^' + source.renderedTableRowPrefix + '(.*)'))
      if (!m) {
        return
      }

      const id = m[1]
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
          updateLinks(td, source.source)
          value = td.innerHTML
        }

        data[fieldId] = value
      })

      this.cache[id] = { id, page, data }
    })
  }

  get (ids, options, callback) {
    if (!Array.isArray(ids)) {
      ids = [ids]
    }

    const source = this.def.sources[0]
    let result = []

    ids = ids.filter(id => {
      if (id in this.cache) {
        result.push(this.cache[id])
        return false
      } else {
        return true
      }
    })

    if (!ids.length) {
      return callback(null, result)
    }

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
          return callback(null, result)
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

            this.parsePage(source, page, body)

            this.get(ids, options, (err, r) => {
              if (err) { return callback(err) }

              result = result.concat(r)

              callback(null, result)
            })
          }
        )
      })
  }
}

module.exports = MediawikiListExtractor

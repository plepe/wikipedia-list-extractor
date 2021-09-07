const parseMediawikiTemplate = require('parse-mediawiki-template')
const wikipediaGetImageProperties = require('./wikipediaGetImageProperties.js')
const updateLinks = require('./updateLinks.js')

class MediawikiListExtractor {
  constructor (id, def, options = {}) {
    this.id = id
    this.def = def
    this.cache = {}
    this.options = options
  }

  loadSource (param, callback) {
    let url = 'https://' + param.source + '/w/api.php?action=parse&format=json&prop=wikitext&page=' + encodeURIComponent(param.title)
    if (this.options.proxy) {
      url = this.options.proxy + 'source=' + encodeURIComponent(param.source) + '&wikitext=' + encodeURIComponent(param.title)
    }

    global.fetch(url)
      .then(res => res.json())
      .then(result => {
        const wikitext = result.parse.wikitext['*']
        callback(null, wikitext)
      })
  }

  loadPage (param, callback) {
    let url = 'https://' + param.source + '/wiki/' + encodeURIComponent(param.title)
    if (this.options.proxy) {
      url = this.options.proxy + 'source=' + encodeURIComponent(param.source) + '&page=' + encodeURIComponent(param.title)
    }

    global.fetch(url)
      .then(res => res.text())
      .then(body => callback(null, body))
  }

  parsePage (source, page, body) {
    const dom = global.document.createElement('div')
    dom.innerHTML = body

    let citeRefs = {}
    if (source.renderedIdInCiteURL) {
      let reg = new RegExp(source.renderedIdInCiteURL)
      let cites = dom.querySelectorAll('ol.references > li > span.reference-text > cite > a')
      Array.from(cites).forEach(a => {
        let m = a.href.match(reg)
        if (m) {
          citeRefs[a.parentNode.parentNode.parentNode.id] = m[1]
        }
      })
    }

    const table = dom.getElementsByClassName(source.renderedTableClass)[0]

    const trs = Array.from(table.rows)

    trs.forEach(tr => {
      let id = tr.id

      if (source.renderedTableRowPrefix) {
        const m = tr.id.match(new RegExp('^' + source.renderedTableRowPrefix + '(.*)'))
        if (!m) {
          return
        }
        id = m[1]
      }

      if (source.renderedIdInCiteURL) {
        let as = tr.getElementsByTagName('a')
        Array.from(as).forEach(a => {
          let cite = a.getAttribute('href').substr(1)
          if (cite in citeRefs) {
            id = citeRefs[cite]
          }
        })

        if (!id) {
          return
        }
      }

      const data = {}

      Object.keys(source.renderedFields).forEach(fieldId => {
        const fieldDef = source.renderedFields[fieldId]

        const td = tr.cells[fieldDef.column]
        if (!td) {
          return
        }

        let value

        if (fieldDef.type === 'image') {
          let imgs = td.getElementsByTagName('img')
          imgs = Array.from(imgs).filter(img => img.width > 64 && img.height > 64)
          if (imgs.length) {
            value = wikipediaGetImageProperties(imgs[0])
          }
        } else {
          updateLinks(td, source.source)
          let dom = td

          if (fieldDef.domQuery) {
            dom = dom.querySelector(fieldDef.domQuery)
            if (!dom) {
              return
            }
          }

          if (fieldDef.domAttribute) {
            value = dom.getAttribute(fieldDef.domAttribute)
          } else {
            value = dom.innerHTML
          }

          if (fieldDef.replaceOld && fieldDef.replaceNew) {
            if (!('replaceRegexp' in fieldDef)) {
              let regexp = fieldDef.replaceOld.match(/^\/(.*)\/(\w*)$/)
              fieldDef.replaceRegexp = new RegExp(regexp[1], regexp[2])
            }

            if (!value.match(fieldDef.replaceRegexp)) {
              return
            }
            value = value.replace(fieldDef.replaceRegexp, fieldDef.replaceNew)

            value = value.trim()
          }

          if (fieldDef.regexp) {
            if (!fieldDef._regexp) {
              let regexp = fieldDef.regexp.match(/^\/(.*)\/(\w*)$/)
              fieldDef._regexp = new RegExp(regexp[1], regexp[2])
            }

            let m = value.match(fieldDef._regexp)
            if (!m) {
              return
            }

            value = m[1].trim()
          }
        }

        data[fieldId] = value

        if (source.renderedIdField === fieldId) {
          id = value
        }
      })

      let url = 'https://' + source.source + '/wiki/' + encodeURIComponent(page.replace(/ /g, '_'))

      if (tr.id) {
        url += '#' + tr.id
      }

      this.cache[id] = { id, page, url, data }
    })
  }

  /**
   * @param {string|string[]} ids - Id or list of ids to load
   * @param {object} options - Options
   * @param {boolean} options.forceCache - check only cached information
   * @param {function} callback - Callback function which will be called with (err, result), where result is an object with {id1: ..., id2: ...}
   */
  get (ids, options, callback) {
    if (!Array.isArray(ids)) {
      ids = [ids]
    }

    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    const source = this.def.sources[0]
    const result = {}

    ids = ids.filter(id => {
      if (id in this.cache) {
        result[id] = this.cache[id]
        return false
      } else {
        return true
      }
    })

    if (!ids.length) {
      return callback(null, result)
    }

    if (options.forceCache) {
      return callback(null, result)
    }

    let search = ''
    if (source.template) {
      search += 'hastemplate:"' + source.template + '" '
    }

    if (source.templateIdField) {
      search += 'insource:/' + source.template + '.*' + source.templateIdField + ' *= *(' + ids.join('|') + ')[^0-9]/ '
    } else if (source.searchIdPrefix || source.searchIdSuffix) {
      search += 'insource:/' + (source.searchIdPrefix || '') + '(' + ids.join('|') + ')' + (source.searchIdSuffix || ' *\\|') + '/ '
    }

    if (source.pageTitleMatch) {
      search += 'intitle:/' + source.pageTitleMatch + '/ '
    }

    let url = 'https://' + source.source + '/w/index.php?search=' + encodeURIComponent(search)
    if (this.options.proxy) {
      url = this.options.proxy + 'source=' + encodeURIComponent(source.source) + '&search=' + encodeURIComponent(search)
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
          (err, body) => {
            if (err) { return callback(err) }

            this.parsePage(source, page, body)

            options.forceCache = true

            this.get(ids, options, (err, r) => {
              if (err) { return callback(err) }

              for (let k in r) {
                result[k] = r[k]
              }

              callback(null, result)
            })
          }
        )
      })
  }
}

module.exports = MediawikiListExtractor

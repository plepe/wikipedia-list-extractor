const Twig = require('twig')
const parseMediawikiTemplate = require('parse-mediawiki-template')
const async = {
  eachSeries: require('async/eachSeries'),
  parallel: require('async/parallel'),
  setImmediate: require('async/setImmediate')
}

const parseRenderedPage = require('./parseRenderedPage')
const findPagesForIds = require('./findPagesForIds')
const findPagesForIdsWikidata = require('./findPagesForIdsWikidata')
const wikidata = require('./wikidata')

class MediawikiListExtractorSource {
  constructor (id, param, options = {}) {
    this.id = id
    this.param = param
    this.cache = {}
    this.aliases = {}
    this.pageCache = {}
    this.options = options
  }

  loadSource (param, callback) {
    let url = param.source + '/w/api.php?action=parse&format=json&prop=wikitext&page=' + encodeURIComponent(param.title)
    if (this.options.proxy) {
      url = this.options.proxy + 'source=' + encodeURIComponent(param.source) + '&wikitext=' + encodeURIComponent(param.title)
    }

    global.fetch(url)
      .then(res => res.json())
      .then(result => {
        const wikitext = result.parse.wikitext['*']
        async.setImmediate(() => callback(null, wikitext))
      })
      .catch(error => callback(error))
  }

  loadPage (param, callback) {
    let url = param.source + '/wiki/' + encodeURIComponent(param.title)
    if (this.options.proxy) {
      url = this.options.proxy + 'source=' + encodeURIComponent(param.source) + '&page=' + encodeURIComponent(param.title)
    }

    global.fetch(url)
      .then(res => res.text())
      .then(body => {
        async.setImmediate(() => callback(null, body))
      })
      .catch(error => callback(error))
  }

  parsePage (page, body, callback) {
    if (!(page in this.pageCache)) {
      this.pageCache[page] = {}
    }

    const items = parseRenderedPage(this.param, body)

    this.pageCache[page].rendered = []

    let fun = 'getItemIdsFromField'
    if (this.param.renderedIdTemplate) {
      fun = 'getItemIdsFromTemplate'
    }

    this[fun](items, 'rendered', page, (err, items, aliases) => {
      if (err) { return callback(err) }

      Object.keys(items).forEach((id, index) => {
        const item = items[id]

        let url = this.param.source + '/wiki/' + encodeURIComponent(page.replace(/ /g, '_'))
        if (this.param.renderedAnchorField) {
          url += '#' + (this.param.anchorPrefix ? this.param.anchorPrefix : '') + item[this.param.renderedAnchorField] + (this.param.anchorSuffix ? this.param.anchorSuffix : '')
        }

        if (id) {
          if (id in this.cache) {
            this.cache[id].url = url
            this.cache[id].rendered = item
          } else {
            this.cache[id] = { id, page, url, rendered: item }
          }

          if (aliases) {
            this.addAliases(this.cache[id], aliases[id])
          }
        }

        this.pageCache[page].rendered.push(id)
      })
    })

    callback(null, this.pageCache[page].rendered)
  }

  loadRendered (page, callback) {
    this.loadPage({ title: page, source: this.param.source },
      (err, body) => {
        if (err) { return callback(err) }

        this.parsePage(page, body, callback)
      }
    )
  }

  getItemIdsViaWikidata (items, prefix, page, callback) {
    const result = {}
    const wdMapping = {}
    const field = this.param[prefix + 'WikidataField']

    items.forEach(item => {
      wdMapping[item[field]] = item
    })

    const query = 'SELECT ?item ?idProp WHERE { ?item wdt:' + this.param.wikidataIdProperty + ' ?idProp. FILTER (?item in (' + items.map(item => 'wd:' + item[field]).join(', ') + '))}'

    wikidata.run(query, { properties: ['idProp'] }, (err, r) => {
      if (err) { return callback(err) }

      for (const wdId in r) {
        const id = r[wdId].idProp.values[0]

        result[id] = wdMapping[wdId]
      }

      callback(null, result)
    })
  }

  getItemIdsFromField (items, prefix, page, callback) {
    const result = {}
    const field = this.param[prefix + 'IdField']

    items.forEach(item => {
      result[item[field]] = item
    })

    callback(null, result)
  }

  getItemIdsFromTemplate (items, prefix, page, callback) {
    const result = {}
    const aliases = {}
    const template = Twig.twig({ data: this.param[prefix + 'IdTemplate'].replace(/\n/g, '\n\n'), async: false })

    items.forEach((item, index) => {
      const ids = template
        .render({ item, index, page })
        .split(/\n/g)
        .filter(id => id !== '')
      const id = ids.length ? ids[0] : null

      if (id === null) {
        console.error('Item #' + index + ', id is null', item)
      } else if (id in result) {
        console.error('Item #' + index + ', duplicate ID "' + id + '"', item)
      } else {
        result[id] = item
        aliases[id] = ids
      }
    })

    callback(null, result, aliases)
  }

  loadRaw (page, callback) {
    if (!(page in this.pageCache)) {
      this.pageCache[page] = {}
    }

    this.pageCache[page].raw = []

    this.loadSource({ title: page, source: this.param.source },
      (err, wikitext) => {
        if (err) { return callback(err) }

        this.pageCache[page].wikitext = wikitext

        let items
        if (Array.isArray(this.param.template)) {
          items = this.param.template
            .map(template => parseMediawikiTemplate(wikitext, template))
            .flat()
        } else {
          items = parseMediawikiTemplate(wikitext, this.param.template)
        }

        let fun = 'getItemIdsFromField'
        if (this.param.templateIdTemplate) {
          fun = 'getItemIdsFromTemplate'
        } else if (this.param.templateWikidataField) {
          fun = 'getItemIdsViaWikidata'
        }

        this[fun](items, 'template', page, (err, items, aliases) => {
          if (err) { return callback(err) }

          for (const id in items) {
            const raw = items[id]

            let url = this.param.source + '/wiki/' + encodeURIComponent(page.replace(/ /g, '_'))
            if (this.param.templateAnchorField) {
              url += '#' + (this.param.anchorPrefix ? this.param.anchorPrefix : '') + raw[this.param.templateAnchorField] + (this.param.anchorSuffix ? this.param.anchorSuffix : '')
            }

            if (id in this.cache) {
              this.cache[id].raw = raw
              this.cache[id].url = url
            } else {
              this.cache[id] = { id, page, url, raw }
            }

            this.addAliases(this.cache[id], aliases[id])

            this.pageCache[page].raw.push(id)
          }

          callback(null, this.pageCache[page].raw)
        })
      }
    )
  }

  addAliases (item, aliases) {
    if (!('aliases' in item)) {
      item.aliases = []
    }

    aliases.forEach(alias => {
      if (!item.aliases.includes(alias)) {
        item.aliases.push(alias)
      }

      this.aliases[alias] = item.id
    })
  }

  loadWikidataFields (items, callback) {
    const wikidataIds = []
    const index = {}

    items.forEach(item => {
      if (item.rendered && this.param.renderedWikidataField && this.param.renderedWikidataField in item.rendered) {
        const qid = item.rendered[this.param.renderedWikidataField]
        wikidataIds.push(qid)
        index[qid] = item
      } else if (item.raw && this.param.templateWikidataField && this.param.templateWikidataField in item.raw) {
        const qid = item.raw[this.param.templateWikidataField]
        wikidataIds.push(qid)
        index[qid] = item
      }
    })

    const properties = []
    this.param.wikidataFields.forEach(field =>
      properties.push(field.property)
    )

    let query = 'SELECT ?item ' + properties.map(p => '?' + p).join(' ') + ' ' +
      'WHERE { ' + properties.map(p => '?item wdt:' + p + ' ?' + p + '.').join('\n') +
      'VALUES ?item {' + wikidataIds.map(id => 'wd:' + id).join(' ') + '}.}'

    wikidata.run(query, {properties}, (err, result) => {
      if (err) { return callback(err) }

      let template
      if (this.param.wikidataIdTemplate) {
        template = Twig.twig({ data: this.param.wikidataIdTemplate.replace(/\n/g, '\n\n'), async: false })
      }

      Object.keys(result).forEach(qid => {
        const qitem = result[qid]
        const item = index[qid]

        item.wikidata = qitem

        if (template) {
          let ids = template.render({item: qitem}).split(/\n/g).filter(id => id)

          this.addAliases(item, ids)
        }
      })

      callback(null, items)
    })
  }

  /**
   * Load all items on the specified wikipedia page
   * @param {string} page - Title of the page
   * @param {object} options - Options
   * @param {boolean} [options.loadRendered=true] - load rendered data
   * @param {boolean} [options.loadRaw=true] - load raw data
   * @param {function} callback - Callback function which will be called with (err, result), where result is an unordered array of all items.
   */
  getPageItems (page, options, callback) {
    const result = []

    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    const functions = {}
    if (!('loadRendered' in options) || options.loadRendered) {
      functions.rendered = done => this.loadRendered(page, done)
    }

    if (!('loadRaw' in options) || options.loadRaw) {
      functions.raw = done => this.loadRaw(page, done)
    }

    async.parallel(functions,
      (err, { rendered, raw }) => {
        if (rendered) {
          rendered.forEach(id => {
            result.push(this.cache[id])
          })
        }

        if (raw) {
          raw.forEach(id => {
            if (!result.includes(this.cache[id])) {
              result.push(this.cache[id])
            }
          })
        }

        if (this.param.wikidataFields) {
          this.loadWikidataFields(result, callback)
        } else {
          callback(err, result)
        }
      }
    )
  }

  /**
   * @param {string|string[]} ids - Id or list of ids to load
   * @param {object} options - Options
   * @param {boolean} options.forceCache - check only cached information
   * @param {boolean} [options.loadRendered=true] - load rendered data
   * @param {boolean} [options.loadRaw=true] - load raw data
   * @param {function} callback - Callback function which will be called with (err, result), where result is an unordered array of all items.
   */
  get (ids, options, callback) {
    if (!Array.isArray(ids)) {
      ids = [ids]
    }

    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    const result = []

    ids = ids.filter(id => {
      if (id in this.cache) {
        result.push(this.cache[id])
        return false
      } else if (id in this.aliases) {
        result.push(this.cache[this.aliases[id]])
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

    let fun = findPagesForIds
    if (this.param.wikidataIdProperty) {
      fun = findPagesForIdsWikidata
    }

    fun(this.param, ids, this.options, (err, pages, mapping) => {
      if (err) { return callback(err) }

      if (!pages.length) {
        return callback(null, result)
      }

      async.eachSeries(pages, (page, done) => {
        if (ids.length === 0) {
          return done()
        }

        this.getPageItems(page, options, (err, items) => {
          if (err) { return callback(err) }

          ids = ids.filter(id => {
            if (id in this.cache) {
              result.push(this.cache[id])
              return false
            } else if (id in this.aliases) {
              result.push(this.cache[this.aliases[id]])
              return false
            } else {
              return true
            }
          })

          done()
        })
      }, (err) => callback(err, result))
    })
  }
}

module.exports = MediawikiListExtractorSource

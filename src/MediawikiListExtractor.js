const parseMediawikiTemplate = require('parse-mediawiki-template')
const async = {
  eachSeries: require('async/eachSeries'),
  parallel: require('async/parallel')
}

const parseRenderedPage = require('./parseRenderedPage')
const renderedItemGetId = require('./renderedItemGetId')
const findPagesForIds = require('./findPagesForIds')

class MediawikiListExtractor {
  constructor (id, def, options = {}) {
    this.id = id
    this.def = def
    this.param = def.param
    this.cache = {}
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
        callback(null, wikitext)
      })
  }

  loadPage (param, callback) {
    let url = param.source + '/wiki/' + encodeURIComponent(param.title)
    if (this.options.proxy) {
      url = this.options.proxy + 'source=' + encodeURIComponent(param.source) + '&page=' + encodeURIComponent(param.title)
    }

    global.fetch(url)
      .then(res => res.text())
      .then(body => callback(null, body))
  }

  parsePage (page, body) {
    if (!(page in this.pageCache)) {
      this.pageCache[page] = {}
    }

    const items = parseRenderedPage(this.param, body)

    this.pageCache[page].rendered = []

    items.forEach((item, index) => {
      const id = renderedItemGetId(this.param, item, page, index)

      let url = this.param.source + '/wiki/' + encodeURIComponent(page.replace(/ /g, '_'))

      if (id) {
        url += '#' + id
      }

      if (id) {
        if (id in this.cache) {
          this.cache[id].url = url
          this.cache[id].rendered = item
        } else {
          this.cache[id] = { id, page, url, rendered: item }
        }
      }

      this.pageCache[page].rendered.push(id)
    })

    return this.pageCache[page].rendered
  }

  loadRendered (page, callback) {
    this.loadPage({ title: page, source: this.param.source },
      (err, body) => {
        if (err) { return callback(err) }

        const result = this.parsePage(page, body)

        callback(null, result)
      }
    )
  }

  loadRaw (page, callback) {
    let result = []

    if (!(page in this.pageCache)) {
      this.pageCache[page] = {}
    }

    this.pageCache[page].raw = []

    this.loadSource({ title: page, source: this.param.source },
      (err, wikitext) => {
        if (err) { return callback(err) }

        this.pageCache[page].wikitext = wikitext

        const items = parseMediawikiTemplate(wikitext, this.param.template)
        items.forEach(raw => {
          const id = raw[this.param.rawIdField]

          if (id) {
            if (id in this.cache) {
              this.cache[id].raw = raw
            } else {
              this.cache[id] = { id, page, raw }
            }

            this.pageCache[page].raw.push(id)
          }
        })

        callback(null, this.pageCache[page].raw)
      }
    )
  }

  /**
   * Load all items on the specified wikipedia page
   * @param {string} page - Title of the page
   * @param {object} options - Options
   * @param {boolean} [options.loadRendered=true] - load rendered data
   * @param {boolean} [options.loadRaw=true] - load raw data
   * @param {function} callback - Callback function which will be called with (err, result), where result is an object with {id1: ..., id2: ...}
   */
  getPageItems (page, options, callback) {
    const result = {}

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
      (err, {rendered, raw}) => {
        if (rendered) {
          rendered.forEach(id => {
            result[id] = this.cache[id]
          })
        }

        if (raw) {
          raw.forEach(id => {
            result[id] = this.cache[id]
          })
        }

        callback(err, result)
      }
    )
  }

  /**
   * @param {string|string[]} ids - Id or list of ids to load
   * @param {object} options - Options
   * @param {boolean} options.forceCache - check only cached information
   * @param {boolean} [options.loadRendered=true] - load rendered data
   * @param {boolean} [options.loadRaw=true] - load raw data
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

    findPagesForIds (this.param, ids, this.options, (err, pages) => {
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
              result[id] = this.cache[id]
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

module.exports = MediawikiListExtractor

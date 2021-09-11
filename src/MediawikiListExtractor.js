const parseMediawikiTemplate = require('parse-mediawiki-template')
const async = {
  parallel: require('async/parallel')
}

const parseProcessedPage = require('./parseProcessedPage')
const processedItemGetId = require('./processedItemGetId')
const findPageForIds = require('./findPageForIds')

class MediawikiListExtractor {
  constructor (id, def, options = {}) {
    this.id = id
    this.def = def
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

  parsePage (source, page, body) {
    if (!(page in this.pageCache)) {
      this.pageCache[page] = {}
    }

    const items = parseProcessedPage(source, body)

    this.pageCache[page].processed = {}

    items.forEach((item, index) => {
      const id = processedItemGetId(source, item, page, index)

      let url = source.source + '/wiki/' + encodeURIComponent(page.replace(/ /g, '_'))

      if (id) {
        url += '#' + id
      }

      if (id) {
        if (id in this.cache) {
          this.cache[id].url = url
          this.cache[id].processed = item
        } else {
          this.cache[id] = { id, page, url, processed: item }
        }
      }

      this.pageCache[page].processed[id] = item
    })

    return this.pageCache[page].processed
  }

  loadProcessed (page, source, callback) {
    this.loadPage({ title: page, source: source.source },
      (err, body) => {
        if (err) { return callback(err) }

        const result = this.parsePage(source, page, body)

        callback(null, result)
      }
    )
  }

  loadRaw (page, source, callback) {
    let result = {}

    if (!(page in this.pageCache)) {
      this.pageCache[page] = {}
    }

    this.pageCache[page].raw = {}

    this.loadSource({ title: page, source: source.source },
      (err, wikitext) => {
        if (err) { return callback(err) }

        this.pageCache[page].wikitext = wikitext

        const items = parseMediawikiTemplate(wikitext, source.template)
        items.forEach(raw => {
          const id = raw.ObjektID

          if (id) {
            if (id in this.cache) {
              this.cache[id].raw = raw
            } else {
              this.cache[id] = { id, page, raw }
            }

            this.pageCache[page].raw[id] = raw
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
   * @param {boolean} [options.loadProcessed=true] - load processed data
   * @param {boolean} [options.loadRaw=true] - load raw data
   * @param {function} callback - Callback function which will be called with (err, result), where result is an object with {id1: ..., id2: ...}
   */
  getPageItems (page, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    const source = this.def.sources[0]

    const functions = {}
    if (!('loadProcessed' in options) || options.loadProcessed) {
      functions.processed = done => this.loadProcessed(page, source, done)
    }

    if (!('loadRaw' in options) || options.loadRaw) {
      functions.raw = done => this.loadRaw(page, source, done)
    }

    async.parallel(functions,
      (err, {processed, raw}) => {
        console.log(processed, raw)
      }
    )
  }

  /**
   * @param {string|string[]} ids - Id or list of ids to load
   * @param {object} options - Options
   * @param {boolean} options.forceCache - check only cached information
   * @param {boolean} [options.loadProcessed=true] - load processed data
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

    findPageForIds (source, ids, this.options, (err, page) => {
      if (err) {
        return callback(err)
      }

      if (!page) {
        return callback(null, result)
      }

      const functions = []
      if (!('loadProcessed' in options) || options.loadProcessed) {
        functions.push(done => this.loadProcessed(page, source, done))
      }

      if (!('loadRaw' in options) || options.loadRaw) {
        functions.push(done => this.loadRaw(page, source, done))
      }

      async.parallel(functions, (err) => {
        if (err) {
          return callback(err)
        }

        options.forceCache = true

        this.get(ids, options, (err, r) => {
          if (err) { return callback(err) }

          for (const k in r) {
            result[k] = r[k]
          }

          callback(null, result)
        })
      })
    })
  }
}

module.exports = MediawikiListExtractor

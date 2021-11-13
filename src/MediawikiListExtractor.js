const fs = require('fs')
const path = require('path')
const yaml = require('yaml')
const async = {
  map: require('async/map')
}

const MediawikiListExtractorSource = require('./MediawikiListExtractorSource')

const defaultOptions = {
  path: path.join(__dirname, '../data')
}

class MediawikiListExtractor {
  constructor (id, def, options = {}) {
    this.id = id
    this.def = def
    this.options = defaultOptions
    for (const k in options) {
      this.options[k] = options[k]
    }
    this.preInitRequests = []

    if (def) {
      return this._init()
    }

    if (Object.keys(fs).length) { // when running in NodeJS environment
      def = fs.readFile(
        this.options.path + '/' + this.id + '.yaml',
        (err, def) => {
          if (err) {
            return console.error(err)
          }
          this.def = yaml.parse(def.toString())
          this._init()
        }
      )
    } else { // running in browser
      global.fetch(this.options.path + '/' + this.id + '.yaml')
        .then(res => res.text())
        .then(def => {
          this.def = yaml.parse(def)
          this._init()
        })
        .catch(err => {
          global.setTimeout(() => console.error(err), 0)
        })
    }
  }

  _init () {
    if (Array.isArray(this.def.param)) {
      this.sources = this.def.param.map(param => new MediawikiListExtractorSource(this.id, param, this.options))
    } else {
      this.sources = [new MediawikiListExtractorSource(this.id, this.def.param, this.options)]
    }

    const todo = this.preInitRequests
    this.preInitRequests = null
    todo.forEach(req => this[req.fun].apply(this, req.arguments))
  }

  /**
   * Clear either the whole cache or the cache for a specific item
   * @param {string} [id] - The id (or an alias) of the item to be cleared.
   */
  cacheClear (id=null) {
    if (this.preInitRequests !== null) {
      return this.preInitRequests.push({ fun: 'cacheClear', arguments })
    }

    this.sources.forEach(source => source.cacheClear(id))
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
    if (this.preInitRequests !== null) {
      return this.preInitRequests.push({ fun: 'getPageItems', arguments })
    }

    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    async.map(
      this.sources,
      (source, done) => source.getPageItems(page, options, done),
      (err, list) => callback(err, list ? list.flat() : null)
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
    if (this.preInitRequests !== null) {
      return this.preInitRequests.push({ fun: 'get', arguments })
    }

    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    async.map(
      this.sources,
      (source, done) => source.get(ids, options, done),
      (err, list) => callback(err, list ? list.flat() : null)
    )
  }
}

module.exports = MediawikiListExtractor

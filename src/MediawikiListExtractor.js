const async = {
  map: require('async/map')
}

const MediawikiListExtractorSource = require('./MediawikiListExtractorSource')

class MediawikiListExtractor {
  constructor (id, def, options = {}) {
    this.id = id
    this.def = def
    this.options = options

    if (Array.isArray(this.def.param)) {
      this.sources = this.def.param.map(param => new MediawikiListExtractorSource(id, param, options))
    } else {
      this.sources = [new MediawikiListExtractorSource(id, this.def.param, options)]
    }
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

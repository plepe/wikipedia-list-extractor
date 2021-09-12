module.exports = class MediawikiListExtractorClient {
  constructor (id, options = {}) {
    this.id = id
    this.options = options
  }

  /**
   * @param {string|string[]} ids - Id or list of ids to load
   * @param {object} options - Options
   * @param {boolean} options.forceCache - check only cached information
   * @param {boolean} [options.loadRendered=true] - load rendered data
   * @param {boolean} [options.loadRaw=true] - load raw data
   * @param {function} callback - Callback function which will be called with (err, result), where result is an object with {id1: ..., id2: ...}
   */
  get (ids, options = {}, callback) {
    global.fetch(
      this.options.serverUrl + '/api/' + this.id + '/' + ids.join(',')
    )
      .then(req => req.json())
      .then(result => callback(null, result))
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
  }
}

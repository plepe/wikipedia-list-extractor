const async = {
  map: require('async/map')
}

module.exports = function (source, ids, options, callback) {
  // if 'template' is an array, query all templates and merge results together
  if (source.template && Array.isArray(source.template)) {
    return async.map(
      source.template,
      (template, done) => {
        const s = JSON.parse(JSON.stringify(source))
        s.template = template

        findPageForIds(s, ids, options, done)
      },
      (err, list) => {
        if (err) { return callback(err) }

        callback(err, list.flat())
      }
    )
  }

  findPageForIds(source, ids, options, callback)
}

function findPageForIds (source, ids, options, callback) {
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

  let url = source.source + '/w/index.php?search=' + encodeURIComponent(search)
  if (options.proxy) {
    url = options.proxy + 'source=' + encodeURIComponent(source.source) + '&search=' + encodeURIComponent(search)
  }

  global.fetch(url)
    .then(res => res.text())
    .then(body => {
      const dom = global.document.createElement('div')
      dom.innerHTML = body
      const articles = dom.querySelectorAll('li.mw-search-result > div > a')

      const result = Array.from(articles).map(
        article => article.getAttribute('title')
      )

      callback(null, result)
    }
    )
}

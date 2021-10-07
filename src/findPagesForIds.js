const Twig = require('twig')
const async = {
  map: require('async/map'),
  mapValues: require('async/mapValues')
}

const regexpEscape = require('./regexpEscape')

module.exports = function (source, ids, options, callback) {
  let idFields = { '': ids }
  if (source.idToQuery) {
    const template = Twig.twig({ data: source.idToQuery, async: false })
    idFields = {}
    ids.forEach(id => {
      const fieldId = template.render({ id }).split(/\|/)
      if (fieldId.length === 1) {
        console.error('Can\'t parse id', id)
      }
      else if (fieldId[0] in idFields) {
        idFields[fieldId[0]].push(fieldId[1])
      } else {
        idFields[fieldId[0]] = [fieldId[1]]
      }
    })
  } else if (source.templateIdField) {
    idFields = {}
    idFields[source.templateIdField] = ids
  }

  if (Object.keys(idFields).length === 0) {
    return callback(new Error('no valid ids found'))
  }

  // if 'template' is an array, query all templates and merge results together
  if (source.template && Array.isArray(source.template)) {
    return async.map(
      source.template,
      (template, done) => {
        const s = JSON.parse(JSON.stringify(source))
        s.template = template

        async.mapValues(
          idFields,
          (ids, idField, done) => findPageForIds(s, idField, ids, options, done),
          (err, list) => {
            if (err) { return callback(err) }
            done(err, Object.values(list).flat())
          }
        )
      },
      (err, list) => {
        if (err) { return callback(err) }

        callback(err, list.flat())
      }
    )
  }

  async.mapValues(
    idFields,
    (ids, idField, done) => findPageForIds(source, idField, ids, options, done),
    (err, list) => {
      if (err) { return callback(err) }
      callback(err, Object.values(list).flat())
    }
  )
}

function findPageForIds (source, idField, ids, options, callback) {
  let search = ''
  if (source.template) {
    search += 'hastemplate:"' + source.template + '" '
  }

  if (idField) {
    search += 'insource:/' + source.template + '.*' + idField + ' *= *(' + ids.map(id => regexpEscape(id)).join('|') + ')[^0-9]/ '
  } else if (source.searchIdPrefix || source.searchIdSuffix) {
    search += 'insource:/' + (source.searchIdPrefix || '') + '(' + ids.map(id => regexpEscape(id)).join('|') + ')' + (source.searchIdSuffix || ' *\\|') + '/ '
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

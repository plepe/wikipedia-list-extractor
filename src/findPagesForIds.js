const Twig = require('twig')
const async = {
  map: require('async/map'),
  mapValues: require('async/mapValues')
}

const regexpEscape = require('./regexpEscape')
const parseIdToQuery = require('./parseIdToQuery')
const findWikidataItems = require('find-wikidata-items')

module.exports = function (source, ids, options, callback) {
  let idFields = { '': ids }
  let wikidataMapQueries = []
  let pages = []
  let queries = []

  if (source.idToQuery) {
    const template = Twig.twig({ data: source.idToQuery, async: false })
    idFields = {}
    ids.forEach(id => {
      let query = parseIdToQuery(template.render({ id }))
      queries.push(query)

      if (query.field && query.value) {
        if (query.field in idFields) {
          idFields[query.field].push(query.value)
        } else {
          idFields[query.field] = [query.value]
        }
      }
      else if (query.field && query.wikidataValue && query.wikidataProperty) {
        let q = {}
        q[query.wikidataProperty] = query.wikidataValue
        wikidataMapQueries.push(q)
      }
      else if (query.page) {
        pages.push(query.page)
      }
    })
  } else if (source.rawIdField) {
    idFields = {}
    idFields[source.rawIdField] = ids
  }

  if (!wikidataMapQueries.length) {
    return part2(source, idFields, pages, options, callback)
  }

  findWikidataItems(wikidataMapQueries, (err, result) => {
    if (err) { return callback(err) }

    Object.keys(result).forEach((r, index) => {
      const query = queries[index]

      if (!(query.field in idFields)) {
        idFields[query.field] = []
      }

      idFields[query.field].push(r[0])
    })

    part2(source, idFields, pages, options, callback)
  })
}

function part2 (source, idFields, pages, options, callback) {
  if (Object.keys(idFields).length === 0 && pages.length === 0) {
    return callback(null, [])
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

        callback(err, list.flat().concat(pages))
      }
    )
  }

  async.mapValues(
    idFields,
    (ids, idField, done) => findPageForIds(source, idField, ids, options, done),
    (err, list) => {
      if (err) { return callback(err) }
      callback(err, Object.values(list).flat().concat(pages))
    }
  )
}

function findPageForIds (source, idField, ids, options, callback) {
  let search = ''
  if (source.template) {
    search += 'hastemplate:"' + source.template + '" '
  }

  if (idField && source.template) {
    search += 'insource:/\| *' + idField + ' *= *(' + ids.map(id => regexpEscape(id)).join('|') + ')[^0-9]/ '
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

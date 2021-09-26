function wikidataQuery (query, options={}, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  let select = ['?item']
  let where = []
  let services = []
  let group_by = ['?item']

  if (options.label) {
    select.push('?itemLabel')
    group_by.push('?itemLabel')
    services.push('SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }')
  }

  for (let property in query) {
    let str = '?item wdt:' + property + ' '

    if (typeof query[property] === 'object') {
      switch (query[property].type) {
        case 'id':
          str += 'wd:' + query[property].value
          break
        case 'string':
        default:
          str += '"' + query[property].value.replace(/"/g, "\\\"") + '"'
          break
      }
    } else {
      str += '"' + query[property].replace(/"/g, "\\\"") + '"'
    }

    where.push(str + '.')
  }

  if (options.properties) {
    options.properties.forEach(property => {
      //select.push('?' + property)
      select.push('(GROUP_CONCAT(DATATYPE(?O' + property + '); SEPARATOR="|") AS ?T' + property + ')')
      select.push('(GROUP_CONCAT(?O' + property + '; SEPARATOR="|") AS ?' + property + ')')
      where.push('OPTIONAL{?item wdt:' + property + ' ?O' + property + ' .}')
      //group_by.push('?O' + property)
    })
  }

  const str = 'SELECT ' + select.join(' ') + ' WHERE {' + where.join(' ') + services.join(' ') + '}' + (group_by.length ? ' GROUP BY ' + group_by.join(' ') : '')

  //console.log(str)

  global.fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(str),
    {
      headers: {
        // lower case to avoid forbidden request headers, see:
        // https://github.com/ykzts/node-xmlhttprequest/pull/18/commits/7f73611dc3b0dd15b0869b566f60b64cd7aa3201
        'user-agent': 'wikipedia-list-extractor',
        accept: 'application/json'
      },
      responseType: 'json'
    })
    .then(response => response.json())
    .then(result => {
      const data = {}

      //console.log(JSON.stringify(result, null, '  '))
      result.results.bindings.forEach(item => {
        const id = item.item.value.match(/(Q[0-9]+)$/)[1]
        let _item = {}

        if (options.label) {
          _item.label = item.itemLabel.value
        }

        if (options.properties) {
          options.properties.forEach(property => {
            let type = ('T' + property) in item ? item['T' + property].value.split('|')[0] : null

            if (item[property].value === '') {
              return
            }

            let values = item[property].value.split('|')
            if (type === null && values[0].match(/^https?:\/\/www\.wikidata\.org\/entity\//)) {
              type = 'id'
              values = values.map(v => v.match(/^https?:\/\/www\.wikidata\.org\/entity\/(Q[0-9]+)$/)[1])
            }

            _item[property] = {
              type, values: [...new Set(values)]
            }
          })
        }

        data[id] = _item
      })

      callback(null, data)
    })
/*
    (err, result) => {
      next(options)
      if (err) { return callback(err) }

      async.map(result.body.results.bindings,
        (entry, done) => {
          const wikidataId = entry.item.value.match(/(Q[0-9]+)$/)[1]
          request(
            { key: 'id', id: wikidataId },
            (err, r) => done(err, r.length ? r[0] : null)
          )
        },
        (err, results) => {
          callback(err, results)
        }
      )
    }
  )
*/
}

module.exports = {
  query: wikidataQuery
}

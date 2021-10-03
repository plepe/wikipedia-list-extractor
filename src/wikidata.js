function wikidataQuery (query, options = {}, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const str = wikidataCompile(query, options)
  wikidataRun(str, options, callback)
}

function wikidataCompile (query, options = {}) {
  const select = ['?item']
  const where = []
  const services = []
  const groupBy = ['?item']

  if (options.label) {
    select.push('?itemLabel')
    groupBy.push('?itemLabel')
    services.push('SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }')
  }

  for (const property in query) {
    let str = '?item wdt:' + property + ' '

    if (typeof query[property] === 'object') {
      switch (query[property].type) {
        case 'id':
          str += 'wd:' + query[property].value
          break
        case 'string':
        default:
          str += '"' + query[property].value.replace(/"/g, '\\"') + '"'
          break
      }
    } else {
      str += '"' + query[property].replace(/"/g, '\\"') + '"'
    }

    where.push(str + '.')
  }

  if (options.properties) {
    options.properties.forEach(property => {
      // select.push('?' + property)
      select.push('(GROUP_CONCAT(DATATYPE(?O' + property + '); SEPARATOR="|") AS ?T' + property + ')')
      select.push('(GROUP_CONCAT(?O' + property + '; SEPARATOR="|") AS ?' + property + ')')
      where.push('OPTIONAL{?item wdt:' + property + ' ?O' + property + ' .}')
      // groupBy.push('?O' + property)
    })
  }

  if (options.articles) {
    options.articles.forEach(article => {
      let url

      const m = article.match(/^([a-z]+)wiki$/)
      if (article === 'commons') {
        url = 'https://commons.wikimedia.org/'
      } else if (m) {
        url = 'https://' + m[1] + '.wikipedia.org/'
      }

      where.push('OPTIONAL {?' + article + ' schema:about ?item. ?' + article + ' schema:isPartOf <' + url + '>.}')
      select.push('?' + article)
      groupBy.push('?' + article)
    })
  }

  const str = 'SELECT ' + select.join(' ') + ' WHERE {' + where.join(' ') + services.join(' ') + '}' + (groupBy.length ? ' GROUP BY ' + groupBy.join(' ') : '')

  // console.log(str)

  return str
}

function wikidataRun (str, options, callback) {
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

      // console.log(JSON.stringify(result, null, '  '))
      result.results.bindings.forEach(item => {
        const id = item.item.value.match(/(Q[0-9]+)$/)[1]
        const _item = {}

        if (options.label) {
          _item.label = item.itemLabel.value
        }

        if (options.properties) {
          options.properties.forEach(property => {
            let type = ('T' + property) in item ? item['T' + property].value.split('|')[0] : null

            if (!(property in item) || item[property].value === '') {
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

        if (options.articles) {
          options.articles.forEach(article => {
            _item[article] = item[article]
          })
        }

        data[id] = _item
      })

      callback(null, data)
    })
}

module.exports = {
  query: wikidataQuery,
  compile: wikidataCompile,
  run: wikidataRun
}

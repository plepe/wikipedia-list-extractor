const wikidata = require('./wikidata')

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
    .then(result => callback(null, result))
    .catch(err => global.setTimeout(() => callback(err), 0))
}

module.exports = function findWikidataItems (queries, callback) {
  let query = []
  const properties = {}
  const finalResult = new Array(queries.length)

  if (queries.length === 0) {
    return callback(null, [])
  }

  queries.forEach(q => {
    let subQuery = '{'

    for (const k in q) {
      properties[k] = true

      if (q[k].match(/^Q[0-9]+$/)) {
        subQuery += '?item wdt:' + k + ' wd:' + q[k] + '.\n?item wdt:' + k + ' ?' + k + '.\n'
      } else {
        subQuery += '?item wdt:' + k + ' "' + q[k] + '".\n?item wdt:' + k + ' ?' + k + '.\n'
      }
    }

    subQuery += '}'

    query.push(subQuery)
  })

  query = 'SELECT ?item ' + Object.keys(properties).map(p => '?' + p).join(' ') + ' WHERE {' + query.join('\nunion') + '}'

  wikidataRun(query, { properties: Object.keys(properties) },
    (err, _result) => {
      if (err) { return callback(err) }

      const result = _result.results.bindings
      result.forEach(item => {
        const id = item.item.value.match(/(Q[0-9]+)$/)[1]
        delete item.item

        queries.forEach((q, index) => {
          const matches = Object.keys(item).filter(pid => {
            let value = item[pid].value
            if (item[pid].type === 'uri') {
              value = item[pid].value.match(/(Q[0-9]+)$/)[1]
            }

            return q[pid] === value
          })

          if (!matches.length) {
            return
          }

          if (!finalResult[index]) {
            finalResult[index] = []
          }

          finalResult[index].push(id)
        })
      })

      callback(null, finalResult)
    }
  )
}

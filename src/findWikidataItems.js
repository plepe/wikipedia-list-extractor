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
  const finalResult = []

  if (queries.length === 0) {
    return callback(null, [])
  }

  queries.forEach(q => {
    let subQuery = '{'

    for (const k in q) {
      properties[k] = true

      subQuery += '?item wdt:' + k + ' "' + q[k] + '".\n?item wdt:' + k + ' ?' + k + '.\n'
    }

    subQuery += '}'

    query.push(subQuery)
  })

  query = 'SELECT ?item ' + Object.keys(properties).map(p => '?' + p).join(' ') + ' WHERE {' + query.join('\nunion') + '}'

  wikidata.run(query, { properties: Object.keys(properties) },
    (err, result) => {
      if (err) { return callback(err) }

      for (const qid in result) {
        for (const pid in result[qid]) {
          result[qid][pid].values.forEach(v => {
            queries.forEach((q, index) => {
              for (const k in q) {
                if (!(k in q) || q[k] !== v) { return }
              }

              if (!finalResult[index]) {
                finalResult[index] = []
              }

              finalResult[index].push(qid)
            })
          })
        }
      }

      callback(null, finalResult)
    }
  )
}

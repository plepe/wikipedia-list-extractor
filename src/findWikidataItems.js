const wikidata = require('./wikidata')

module.exports = function findWikidataItems (queries, callback) {
  let query = []
  const properties = {}

  if (queries.length === 0) {
    return callback(null, [])
  }

  queries.forEach(q => {
    properties[q.wikidataProperty] = true
  })

  queries.forEach(q => {
    query.push('{?item wdt:' + q.wikidataProperty + ' "' + q.wikidataValue + '".?item wdt:' + q.wikidataProperty + ' ?' + q.wikidataProperty + ' }')
  })

  query = 'SELECT ?item ' + Object.keys(properties).map(p => '?' + p).join(' ') + ' WHERE {' + query.join('\nunion') + '}'

  wikidata.run(query, { properties: Object.keys(properties) },
    (err, result) => {
      if (err) { return callback(err) }

      for (const qid in result) {
        for (const pid in result[qid]) {
          result[qid][pid].values.forEach(v => {
            queries.forEach(q => {
              if (q.wikidataProperty === pid && q.wikidataValue === v) {
                q.itemId = qid
              }
            })
          })
        }
      }

      callback(null, queries)
    }
  )
}

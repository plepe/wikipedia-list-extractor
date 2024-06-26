import wikidata from './wikidata.js'

function findPagesForIdsWikidata (source, ids, options, callback) {
  const idProp = source.wikidataIdProperty
  const listProp = source.wikidataListProperty
  let query = 'SELECT ?item ?idProp ?' + listProp + ' ?listUrl WHERE {?item wdt:' + idProp + ' "' + ids[0] + '".?item wdt:' + idProp + ' ?idProp.OPTIONAL{?item wdt:' + listProp + ' ?' + listProp + '.?listUrl schema:about ?' + listProp + '. ?listUrl schema:isPartOf <https://de.wikipedia.org/>.}}'
  if (ids.length > 1) {
    query = 'SELECT ?item ?idProp ?' + listProp + ' ?listUrl WHERE {?item wdt:' + idProp + ' ?idProp.FILTER REGEX(STR(?idProp), "^(' + ids.join('|') + ')$").?item wdt:' + idProp + ' ?idProp.OPTIONAL{?item wdt:' + listProp + ' ?' + listProp + '.?listUrl schema:about ?' + listProp + '. ?listUrl schema:isPartOf <https://de.wikipedia.org/>.}}'
  }

  const _options = JSON.parse(JSON.stringify(options))
  _options.properties = ['idProp', listProp, 'listUrl']

  wikidata.run(query, _options,
    (err, result) => {
      if (err) { return callback(err) }

      const pages = {}
      const mapping = {}

      for (const id in result) {
        const item = result[id]
        if ('listUrl' in item && item.listUrl.values.length) {
          const m = item.listUrl.values[0].match(/\/wiki\/(.*)$/)
          if (m) {
            pages[decodeURIComponent(m[1])] = true
          }
        }

        mapping[item.idProp.values[0]] = id
      }

      callback(null, Object.keys(pages), mapping)
    }
  )
}

export default findPagesForIdsWikidata

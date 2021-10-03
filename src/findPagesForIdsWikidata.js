const wikidata = require('./wikidata')

module.exports = function findPageForIdsWikidata (source, ids, options, callback) {

  let idProp = source.wikidataIdProperty
  let listProp = source.wikidataListProperty
  let query = 'SELECT ?item ?idProp ?' + listProp + ' ?listUrl WHERE {?item wdt:' + idProp + ' "' + ids[0] + '".?item wdt:' + idProp + ' ?idProp.OPTIONAL{?item wdt:' + listProp + ' ?' + listProp + '.?listUrl schema:about ?' + listProp + '. ?listUrl schema:isPartOf <https://de.wikipedia.org/>.}}'
  if (ids.length > 1) {
    let query = 'SELECT ?item ?idProp ?' + listProp + ' ?listUrl WHERE {?item wdt:' + idProp + ' ?idProp.FILTER REGEX(STR(?idProp), "^(' + ids.join('|') + ')$").?item wdt:' + idProp + ' ?idProp.OPTIONAL{?item wdt:' + listProp + ' ?' + listProp + '.?listUrl schema:about ?' + listProp + '. ?listUrl schema:isPartOf <https://de.wikipedia.org/>.}}'
  }

  wikidata.run(query, {properties:['idProp', listProp, 'listUrl']},
    (err, result) => {
      let pages = {}
      let mapping = {}

      for (let id in result) {
        let item = result[id]
        console.log(item)
        if ('listUrl' in item && item.listUrl.values.length) {
          let m = item.listUrl.values[0].match(/\/wiki\/(.*)$/)
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

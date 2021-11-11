const fetch = require('node-fetch')

module.exports = function proxy (param, callback) {
  let url = param.source + '/'

  if (param.search) {
    url += 'w/index.php?search=' + encodeURIComponent(param.search)
  }
  if (param.page) {
    url += 'wiki/' + encodeURIComponent(param.page.replace(/ /g, '_'))
  }
  if (param.wikitext) {
    url += 'w/api.php?action=parse&format=json&prop=wikitext&page=' + encodeURIComponent(param.wikitext.replace(/ /g, '_'))
  }
  if (param.query) {
    url += 'sparql?query=' + encodeURIComponent(param.query)
  }

  // console.log('> ' + url)

  fetch(url)
    .then(res => res.text())
    .then(body => callback(null, body))
}

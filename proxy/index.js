const fetch = require('node-fetch')

module.exports = function proxy (param, callback) {
  const headers = {
    // lower case to avoid forbidden request headers, see:
    // https://github.com/ykzts/node-xmlhttprequest/pull/18/commits/7f73611dc3b0dd15b0869b566f60b64cd7aa3201
    'user-agent': 'wikipedia-list-extractor'
  }
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
    headers.accept = 'application/json'
  }

  // console.log('> ' + url)

  fetch(url, {headers})
    .then(res => res.text())
    .then(body => callback(null, body))
}

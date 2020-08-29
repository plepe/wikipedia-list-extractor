const fetch = require('node-fetch')

module.exports = function proxy (param, callback) {
  let url = 'https://' + param.source + '/'

  if (param.search) {
    url += 'w/index.php?search=' + encodeURIComponent(param.search)
  }
  if (param.page) {
    url += 'wiki/' + encodeURIComponent(param.page.replace(/ /g, '_'))
  }

  // console.log('> ' + url)

  fetch(url)
    .then(res => res.text())
    .then(body => callback(null, body))
}

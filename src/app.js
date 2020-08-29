const MediawikiListExtractor = require('./MediawikiListExtractor.js')
const escHtml = require('html-escaper').escape

const options = {
  proxy: 'proxy.php?'
}

let extractor

function load_extractor(id, callback) {
  if (extractor && extractor.id === id) {
    return callback(null, extractor)
  }

  global.fetch('data/' + id + '.json')
    .then(res => res.json())
    .then(def => {
      extractor = new MediawikiListExtractor(id, def)
      callback(null, extractor)
    })
}

window.onload = () => {
  const f = document.getElementsByTagName('form')[0]
  f.onsubmit = () => {
    load_extractor('AT-BDA', (err, extractor) => {
      if (err) { return alert(err) }

      let ids = f.elements.ids.value
      extractor.get(ids.split(/ /g), options, (err, result) => {
        document.getElementById('result').innerHTML = escHtml(JSON.stringify(result, null, '    '))
      })
    })

    return false
  }
}

const MediawikiListExtractor = require('./MediawikiListExtractor.js')
const escHtml = require('html-escaper').escape

const options = {
  proxy: 'proxy/?'
}

let extractor

function loadExtractor (id, callback) {
  if (extractor && extractor.id === id) {
    return callback(null, extractor)
  }

  global.fetch('data/' + id + '.json')
    .then(res => res.json())
    .then(def => {
      extractor = new MediawikiListExtractor(id, def, options)
      callback(null, extractor)
    })
}

window.onload = () => {
  const f = document.getElementsByTagName('form')[0]
  f.onsubmit = () => {
    loadExtractor('AT-BDA', (err, extractor) => {
      if (err) { return global.alert(err) }

      const ids = f.elements.ids.value
      extractor.get(ids.split(/ /g), (err, result) => {
        if (err) { return global.alert(err) }

        document.getElementById('result').innerHTML = escHtml(JSON.stringify(result, null, '    '))
      })
    })

    return false
  }
}

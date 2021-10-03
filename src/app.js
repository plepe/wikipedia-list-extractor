const MediawikiListExtractor = require('./MediawikiListExtractor.js')
const escHtml = require('html-escaper').escape

const options = {
  proxy: 'proxy/?'
}

const extractors = {}

function loadExtractor (id, callback) {
  if (extractors[id]) {
    return callback(null, extractors[id])
  }

  global.fetch('data/' + id + '.json')
    .then(res => res.json())
    .then(def => {
      extractors[id] = new MediawikiListExtractor(id, def, options)
      callback(null, extractors[id])
    })
}

window.onload = () => {
  global.fetch('data/')
    .then(res => res.text())
    .then(body => {
      const div = document.createElement('div')
      div.innerHTML = body

      const as = div.getElementsByTagName('a')
      Array.from(as).forEach(a => {
        const m = a.getAttribute('href').match(/^([A-Z-]+)\.json$/)
        if (m) {
          const option = document.createElement('option')
          option.value = m[1]
          option.appendChild(document.createTextNode(m[1]))
          f.elements.list.appendChild(option)
        }
      })

      // if (err) { return global.alert(err) }
    })

  const f = document.getElementsByTagName('form')[0]
  f.onsubmit = () => {
    loadExtractor(f.elements.list.value, (err, extractor) => {
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

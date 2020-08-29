const MediawikiListExtractor = require('./MediawikiListExtractor.js')
const escHtml = require('html-escaper').escape

const options = {
  proxy: 'proxy/?'
}

let extractors = {}

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
      let div = document.createElement('div')
      div.innerHTML = body

      let as = div.getElementsByTagName('a')
      let lists = Array.from(as).forEach(a => {
        let m = a.getAttribute('href').match(/^([A-Z-]+)\.json$/)
        if (m) {
          let option = document.createElement('option')
          option.value = m[1]
          option.appendChild(document.createTextNode(m[1]))
          f.elements.list.appendChild(option)
        }
      })

      //if (err) { return global.alert(err) }
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

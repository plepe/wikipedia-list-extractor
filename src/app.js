import { escape as escHtml } from 'html-escaper'

import MediawikiListExtractor from './MediawikiListExtractor.js'
import MediawikiListExtractorClient from './MediawikiListExtractorClient.js'

const options = {
  path: 'data',
  proxy: 'proxy/?'
}

const extractors = {
  server: {},
  browser: {}
}

function loadExtractor (method, id, callback) {
  if (extractors[method][id]) {
    return callback(null, extractors[method][id])
  }

  if (method === 'server') { // run on server (we are client)
    const options = {
      serverUrl: '.'
    }
    extractors[method][id] = new MediawikiListExtractorClient(id, options)
    callback(null, extractors[method][id])
  } else {
    extractors[method][id] = new MediawikiListExtractor(id, null, options)
    callback(null, extractors[method][id])
  }
}

window.onload = () => {
  global.fetch('data/')
    .then(res => res.text())
    .then(body => {
      const div = document.createElement('div')
      div.innerHTML = body

      const as = div.getElementsByTagName('a')
      Array.from(as).forEach(a => {
        const m = a.getAttribute('href').match(/^([a-zA-Z-]+)\.yaml$/)
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
    loadExtractor(f.elements.method.value, f.elements.list.value, (err, extractor) => {
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

const MediawikiListExtractor = require('./MediawikiListExtractor.js')

const options = {
  proxy: 'proxy.php?'
}

window.onload = () => {
  const f = document.getElementsByTagName('form')[0]
  f.onsubmit = () => {
    global.fetch('data/bda.json')
      .then(res => res.json())
      .then(def => {
        const extractor = new MediawikiListExtractor(def)
        let ids = f.elements.ids.value
        extractor.get(ids.split(/ /g), options, (err, result) => {
          document.getElementById('result').innerHTML = JSON.stringify(result, null, '    ')
        })
      })

    return false
  }
}

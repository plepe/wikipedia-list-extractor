module.exports = function updateLinks (dom, url) {
  let as = dom.getElementsByTagName('a')
  Array.from(as).forEach(a => {
    a.href = 'https://' + url + a.href
  })
}

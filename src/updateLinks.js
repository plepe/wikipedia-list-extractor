module.exports = function updateLinks (dom, url) {
  const as = dom.getElementsByTagName('a')
  Array.from(as).forEach(a => {
    a.href = 'https://' + url + a.href
  })
}

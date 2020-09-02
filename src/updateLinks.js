module.exports = function updateLinks (dom, url) {
  const as = dom.getElementsByTagName('a')
  Array.from(as).forEach(a => {
    a.setAttribute('href', 'https://' + url + a.getAttribute('href'))
  })
}

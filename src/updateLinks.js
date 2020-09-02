module.exports = function updateLinks (dom, url) {
  const as = dom.getElementsByTagName('a')
  Array.from(as).forEach(a => {
    if (!a.getAttribute('href').match(/^\w+:/)) {
      a.setAttribute('href', 'https://' + url + a.getAttribute('href'))
    }
  })
}

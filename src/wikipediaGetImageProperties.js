module.exports = function wikipediaGetImageProperties (img) {
  const m = img.src.match(/^(https?:)?\/\/upload.wikimedia.org\/wikipedia\/commons\/thumb\/\w+\/\w+\/([^/]+)/)
  if (m) {
    const file = decodeURIComponent(m[2]).replace(/_/g, ' ')

    return {
      id: file,
      width: img.getAttribute('data-file-width'),
      height: img.getAttribute('data-file-height')
    }
  }
}

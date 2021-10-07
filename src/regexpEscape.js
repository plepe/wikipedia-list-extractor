module.exports = function regexpEscape (str) {
  return str.replace(/\//g, '\\/')
}

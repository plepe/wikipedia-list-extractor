function regexpEscape (str) {
  return str.replace(/\//g, '\\/')
}

export default regexpEscape

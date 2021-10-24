module.exports = function (str) {
  const rows = str.split(/\n/g)
  const result = {}

  rows.forEach(row => {
    const m = row.match(/^([a-zA-Z0-9]+)=(.*)$/)
    if (m) {
      result[m[1]] = m[2]
    }
  })

  return result
}

module.exports = function (def, item, page, index) {
  let id = index

  if (def.renderedIdField) {
    id = item[def.renderedIdField]
  }

  return id
}

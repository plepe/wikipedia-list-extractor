const updateLinks = require('./updateLinks.js')
const wikipediaGetImageProperties = require('./wikipediaGetImageProperties.js')

module.exports = function parseProcessedPage (def, body) {
  const result = []

  const dom = global.document.createElement('div')
  dom.innerHTML = body

  const citeRefs = {}
  if (def.renderedIdInCiteURL) {
    const reg = new RegExp(def.renderedIdInCiteURL)
    const cites = dom.querySelectorAll('ol.references > li > span.reference-text > cite > a')
    Array.from(cites).forEach(a => {
      const m = a.href.match(reg)
      if (m) {
        citeRefs[a.parentNode.parentNode.parentNode.id] = m[1]
      }
    })
  }

  const table = dom.querySelector('table' + (def.renderedTableClass ? '.' + def.renderedTableClass : ''))
  if (!table) {
    throw new Error('no table found')
  }

  const trs = Array.from(table.rows)
  trs.splice(0, 1) // ignore header row

  trs.forEach(tr => {
    const item = {}

    /*
    if (def.renderedTableRowPrefix) {
      const m = tr.id.match(new RegExp('^' + def.renderedTableRowPrefix + '(.*)'))
      if (!m) {
        return
      }
      id = m[1]
    }

    if (def.renderedIdInCiteURL) {
      const as = tr.getElementsByTagName('a')
      Array.from(as).forEach(a => {
        const cite = a.getAttribute('href').substr(1)
        if (cite in citeRefs) {
          id = citeRefs[cite]
        }
      })

      if (!id) {
        return
      }
    }
    */

    Object.keys(def.renderedFields).forEach(fieldId => {
      const fieldDef = def.renderedFields[fieldId]

      const td = tr.cells[fieldDef.column]
      if (!td) {
        return
      }

      let value

      if (fieldDef.type === 'image') {
        let imgs = td.getElementsByTagName('img')
        imgs = Array.from(imgs).filter(img => img.width > 64 && img.height > 64)
        if (imgs.length) {
          value = wikipediaGetImageProperties(imgs[0])
        }
      } else {
        updateLinks(td, def.source)
        let dom = td

        if (fieldDef.domQuery) {
          dom = dom.querySelector(fieldDef.domQuery)
          if (!dom) {
            return
          }
        }

        if (fieldDef.domAttribute) {
          value = dom.getAttribute(fieldDef.domAttribute)
        } else {
          value = dom.innerHTML
        }

        if (fieldDef.replaceOld && fieldDef.replaceNew) {
          if (!('replaceRegexp' in fieldDef)) {
            const regexp = fieldDef.replaceOld.match(/^\/(.*)\/(\w*)$/)
            fieldDef.replaceRegexp = new RegExp(regexp[1], regexp[2])
          }

          if (!value.match(fieldDef.replaceRegexp)) {
            return
          }
          value = value.replace(fieldDef.replaceRegexp, fieldDef.replaceNew)

          value = value.trim()
        }

        if (fieldDef.regexp) {
          if (!fieldDef._regexp) {
            const regexp = fieldDef.regexp.match(/^\/(.*)\/(\w*)$/)
            fieldDef._regexp = new RegExp(regexp[1], regexp[2])
          }

          const m = value.match(fieldDef._regexp)
          if (!m) {
            return
          }

          value = m[1].trim()
        }
      }

      if (value) {
        item[fieldId] = value
      }
    })

    result.push(item)
  })

  return result
}

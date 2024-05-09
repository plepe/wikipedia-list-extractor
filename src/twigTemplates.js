import Twig from 'twig'

Twig.extendFilter('url_decode', (value) => decodeURI(value))
Twig.extendFilter('match', (value, param) => {
  const regexp = new RegExp(param[0], param[1])
  return value.match(regexp)
})

const templates = {}

function twigTemplates (template) {
  if (!(template in templates)) {
    templates[template] = Twig.twig({ data: template })
  }

  return templates[template]
}

export default twigTemplates

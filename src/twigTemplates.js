const Twig = require('twig')

const templates = {}

module.exports = function twigTemplates (template) {
  if (!(template in templates)) {
    templates[template] = Twig.twig({ data: template })
  }

  return templates[template]
}

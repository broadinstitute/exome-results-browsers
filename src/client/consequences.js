import browserConfig from '@browser/config'

const categoryByTerm = Object.create(null)
const labelByTerm = Object.create(null)

browserConfig.variants.consequences.forEach(consequence => {
  categoryByTerm[consequence.term] = consequence.category
  labelByTerm[consequence.term] = consequence.label
})

export const getCategoryFromConsequence = consequenceTerm => categoryByTerm[consequenceTerm]

export const getLabelForConsequenceTerm = consequenceTerm =>
  labelByTerm[consequenceTerm] || consequenceTerm

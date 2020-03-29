const root = "https://useconcept.art/ontology#"

interface ConceptOntology {
  backupOf: string,
  parent: string,
  inListItem: string
}

const ns: ConceptOntology = {
  backupOf: `${root}backupOf`,
  parent: `${root}parent`,
  inListItem: `${root}inListItem`,
}

export default ns

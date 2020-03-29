const root = "https://useconcept.art/ontology#"
const terms = ["backupOf", "parent"]

export default terms.reduce((m, term) => {
  m[term] = `${root}${term}`
  return m
}, {})

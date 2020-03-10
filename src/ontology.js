const root = "https://useconcept.art/ontology#"
const terms = ["backupOf"]
export default terms.reduce((m, term) => {
  m[term] = `${root}${term}`
  return m
}, {})

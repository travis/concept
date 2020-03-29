const root = "https://useconcept.art/ontology#"
const terms = ["backupOf", "parent", "inListItem"]

export default terms.reduce((m, term) => {
  m[term] = `${root}${term}`
  return m
}, {})

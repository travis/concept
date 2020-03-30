import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { acl, schema, dc } from 'rdf-namespaces';
import concept from '../ontology'
import { pageUris} from './model'

export const addPublicPage = (publicPageListUri, page) =>
  data[publicPageListUri][schema.itemListElement].add(namedNode(page))

export const removePublicPage = (publicPageListUri, page) =>
  data[publicPageListUri][schema.itemListElement].delete(namedNode(page))

export const addPublicAccess = (publicAccessUri, accessType) =>
  data[publicAccessUri][acl.mode].add(namedNode(acl[accessType]))

export const removePublicAccess = (publicAccessUri, accessType) =>
  data[publicAccessUri][acl.mode].delete(namedNode(acl[accessType]))

export function pageUrisFromPageUri(pageUri) {
  return pageUris(`${pageUri.split("/").slice(0, -1).join("/")}/`)
}

export const listResolver = async query => {
  const newResult = []
  for await (const result of query){
    newResult.push(result)
  }
  return newResult
}

export const resolveValues = terms => terms.map(term => term && term.value)

export const pageListItemResolver = async query => {
  const [uri, name] = resolveValues(await Promise.all([
    query,
    query[schema.name],
  ]))
  const [pageNode] = await Promise.all([
    query[schema.item]
  ])
  return {uri, name, pageNode}
}

export const pageListItemsResolver = async query => {
  const itemQueries = await listResolver(query.sort(schema.position))
  return Promise.all(itemQueries.map(pageListItemResolver))
}

export const pageResolver = async query => {
  const [uri, id, text, name, inListItem, parent] = resolveValues(await Promise.all([
    query, query[dc.identifier], query[schema.text], query[schema.name],
    query[concept.inListItem], query[concept.parent]
  ]))
  return {id, text, name, uri, parent, inListItem, ...pageUrisFromPageUri(uri)}
}

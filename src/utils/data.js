import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { acl, schema, dc, foaf } from 'rdf-namespaces';
import concept from '../ontology'
import { pageUris} from './model'
import { patchDocument } from '../utils/ldflex-helper'

export const follow = (webId, followWebId) =>
  data[webId][foaf.knows].add(namedNode(followWebId))

export const unfollow = (webId, unfollowWebId) =>
  data[webId][foaf.knows].delete(namedNode(unfollowWebId))

export const addPublicPage = (publicPageListUri, page) =>
  data[publicPageListUri][schema.itemListElement].add(namedNode(page))

export const removePublicPage = (publicPageListUri, page) =>
  data[publicPageListUri][schema.itemListElement].delete(namedNode(page))

export const addPublicAccess = (publicAccessUri, accessType) =>
  data[publicAccessUri][acl.mode].add(namedNode(acl[accessType]))

export const removePublicAccess = async (publicAccessUri, accessType, publicPages, page, hasWrite) => {
  if (accessType === "Write"){
    await data[publicAccessUri][acl.mode].delete(namedNode(acl.Write))
  } else if (accessType === "Read"){
    await Promise.all([
      hasWrite ? (
        patchDocument(publicAccessUri, `
DELETE DATA {
<${publicAccessUri}>
  <${acl.mode}> <${acl.Read}> ;
  <${acl.mode}> <${acl.Write}> .
}
`)
      ) : (
        data[publicAccessUri][acl.mode].delete(namedNode(acl.Read))
      ),
      removePublicPage(publicPages, page)
    ])
  }
}


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

export const listValuesResolver = async query => resolveValues(await listResolver(query))

export const valueResolver = async query => {
  const term = await query
  return term && term.value
}

export const pageListItemResolver = async query => {
  const [uri, name, pageUri] = resolveValues(await Promise.all([
    query,
    query[schema.name],
    query[schema.item]
  ]))
  return {uri, name, pageUri}
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

import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { acl, schema, dc, dct, foaf } from 'rdf-namespaces';
import concept from '../ontology'
import { pageUris, conceptUris, documentUris } from './model'
import { patchDocument } from '../utils/ldflex-helper'
import { Document, Concept, Page, PageListItem, ConceptListItem } from '../utils/model'

const aclNamespace: any = acl

export const follow = (webId: string, followWebId: string) =>
  data[webId][foaf.knows].add(namedNode(followWebId))

export const unfollow = (webId: string, unfollowWebId: string) =>
  data[webId][foaf.knows].delete(namedNode(unfollowWebId))

export const addPublicPage = (publicPageListUri: string, page: string) =>
  data[publicPageListUri][schema.itemListElement].add(namedNode(page))

export const removePublicPage = (publicPageListUri: string, page: string) =>
  data[publicPageListUri][schema.itemListElement].delete(namedNode(page))

export const addPublicAccess = (publicAccessUri: string, accessType: string) =>
  data[publicAccessUri][acl.mode].add(namedNode(aclNamespace[accessType]))

export const removePublicAccess = async (publicAccessUri: string, accessType: string, publicPages: string, page: string, hasWrite: boolean) => {
  if (accessType === "Write") {
    await data[publicAccessUri][acl.mode].delete(namedNode(acl.Write))
  } else if (accessType === "Read") {
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

export type Resolver<T> = (query: any) => Promise<T>

export const listResolver: Resolver<any[]> = async query => {
  const newResult = []
  for await (const result of query) {
    newResult.push(result)
  }
  return newResult
}

export const resolveValues: (terms: any[]) => any[] = terms => terms.map(term => term && term.value)

export const listValuesResolver: Resolver<any> = async query => resolveValues(await listResolver(query))

export const valueResolver: Resolver<any> = async query => {
  const term = await query
  return term && term.value
}

export const dateResolver: Resolver<any> = async query => {
  const term = await query
  return term && new Date(term.value)
}

export const pageListItemResolver: Resolver<PageListItem> = async query => {
  const [uri, name, pageUri] = resolveValues(await Promise.all([
    query,
    query[schema.name],
    query[schema.item]
  ]))
  return { uri, name, pageUri }
}

export const pageListItemsResolver: Resolver<PageListItem[]> = async query => {
  const itemQueries = await listResolver(query.sort(schema.position))
  return Promise.all(itemQueries.map(pageListItemResolver))
}

export const conceptListItemResolver: Resolver<ConceptListItem> = async query => {
  const [uri, name, conceptUri] = resolveValues(await Promise.all([
    query,
    query[schema.name],
    query[schema.item]
  ]))
  return { uri, name, conceptUri }
}

export const conceptListItemsResolver: Resolver<ConceptListItem[]> = async query => {
  const itemQueries = await listResolver(query.sort(schema.name))
  return Promise.all(itemQueries.map(conceptListItemResolver))
}

export const pageResolver: Resolver<Page> = async query => {
  const [uri, id, text, name, inListItem, parentUri] = resolveValues(await Promise.all([
    query, query[dc.identifier], query[schema.text], query[schema.name],
    query[concept.inListItem], query[concept.parent]
  ]))
  return { id, text, name, uri, parentUri, inListItem, ...pageUris(uri) }
}

export const conceptResolver: Resolver<Concept> = async query => {
  const [uri, id, text, name, inListItem, parentUri] = resolveValues(await Promise.all([
    query, query[dc.identifier], query[schema.text], query[schema.name],
    query[concept.inListItem], query[concept.parent]
  ]))
  const referencedBy = await listValuesResolver(query[dct.isReferencedBy])
  return { id, text, name, uri, parentUri, inListItem, referencedBy, ...conceptUris(uri) }
}

export const documentResolver: Resolver<Document> = async query => {
  const [uri, id, text, name, inListItem, parentUri] = resolveValues(await Promise.all([
    query, query[dc.identifier], query[schema.text], query[schema.name],
    query[concept.inListItem], query[concept.parent]
  ]))
  return { id, text, name, uri, parentUri, inListItem, ...documentUris(uri) }
}

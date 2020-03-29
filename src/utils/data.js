import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { acl, schema, rdf, dc } from 'rdf-namespaces';
import uuid from 'uuid/v1';
import concept from '../ontology'
import { createNonExistentDocument, deleteFile } from './ldflex-helper';
import { createDefaultAcl } from '../utils/acl';
import {newPage, pageUris} from './model'

export const addPublicPage = (publicPageListUri, page) =>
  data[publicPageListUri][schema.itemListElement].add(namedNode(page))

export const removePublicPage = (publicPageListUri, page) =>
  data[publicPageListUri][schema.itemListElement].delete(namedNode(page))

export const addPublicAccess = (publicAccessUri, accessType) =>
  data[publicAccessUri][acl.mode].add(namedNode(acl[accessType]))

export const removePublicAccess = (publicAccessUri, accessType) =>
  data[publicAccessUri][acl.mode].delete(namedNode(acl[accessType]))

const refDocument = (ref) => {
  const url = new URL(ref)
  url.hash = ""
  return url.toString()
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
  const itemQueries = await listResolver(query)
  return Promise.all(itemQueries.map(pageListItemResolver))
}

export const pageResolver = async query => {
  const [uri, id, text, name] = resolveValues(await Promise.all([
    query, query[dc.identifier], query[schema.text], query[schema.name]
  ]))
  const [parent, inListItem] = await Promise.all([
    query[concept.parent], query[concept.inListItem]
  ])
  const {containerUri, docUri, subpageContainerUri} = pageUrisFromPageUri(uri)
  return {id, text, name, uri, containerUri, docUri, subpageContainerUri, parent, inListItem}
}

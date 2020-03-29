import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { acl, schema, rdf, dc } from 'rdf-namespaces';
import uuid from 'uuid/v1';
import concept from '../ontology'
import { createNonExistentDocument, deleteFile } from './ldflex-helper';
import { createDefaultAcl } from '../utils/acl';

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

const initialPage = JSON.stringify([
  {
    type: 'paragraph',
    children: [{text: ''}]
  }
])

export function pageUris(containerUri) {
  const docUri = `${containerUri}index.ttl`
  const uri = `${docUri}#Page`
  const subpageContainerUri = `${containerUri}pages/`
  return ({ containerUri, docUri, uri, subpageContainerUri })
}

export function pageUrisFromPageUri(pageUri) {
  return pageUris(`${pageUri.split("/").slice(0, -1).join("/")}/`)
}

export function newPage(parent, {name="Untitled"}={}){
  const id = uuid()
  const {containerUri, docUri, uri, subpageContainerUri} = pageUris(`${parent.subpageContainerUri}${id}/`)
  return ({
    id,
    uri,
    docUri,
    containerUri,
    subpageContainerUri: `${containerUri}pages/`,
    name,
    text: initialPage
  })
}

const addPageMetadata = async (parent, page) => {
  const childListItemUri = `${parent.docUri}#${page.id}`
  const childListItemNode = data[childListItemUri]
  await Promise.all([
    childListItemNode[rdf.type].set(namedNode(schema.ListItem)),
    childListItemNode[schema.item].set(namedNode(page.uri)),
    childListItemNode[schema.name].set(page.name)
  ])
  return {inListItem: childListItemNode, ...page}
}

export const addPage = async (parent, pageProps={}) => {
  const barePage = newPage(parent, pageProps)
  await createNonExistentDocument(barePage.docUri)
  const page = await addPageMetadata(parent, barePage)
  const pageNode = data[page.uri]
  await Promise.all([
    pageNode[rdf.type].set(schema.DigitalDocument),
    pageNode[dc.identifier].set(page.id),
    pageNode[schema.text].set(page.text),
    pageNode[schema.name].set(page.name),
    pageNode[concept.parent].set(namedNode(parent.uri)),
    pageNode[concept.inListItem].set(page.inListItem)
  ])
  await data[parent.uri][schema.itemListElement].add(page.inListItem)
  return page
}

export const addSubPage = async (pageListItem, pageProps={}) => {
  const parentPage = await pageResolver(pageListItem.pageNode)
  return await addPage(parentPage, pageProps)
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

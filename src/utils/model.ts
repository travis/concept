import uuid from 'uuid/v1';
import { schema, rdf, dc } from 'rdf-namespaces';
import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { createNonExistentDocument } from './ldflex-helper';
import concept from '../ontology';
import { pageResolver } from './data';
import { conceptContainerUrl, publicPagesUrl } from '../utils/urls';

export interface PageContainer {
  uri: string,
  docUri: string,
  containerUri: string,
  subpageContainerUri: string
}

export interface Workspace extends PageContainer {
  publicPages: string
}

export interface Page extends PageContainer {
  id: string,
  name: string,
  text: string
}

export interface PageListItem {
  uri: string,
  name: string,
  pageNode: any
}

export interface PageProps {
  name?: string
}

const initialPage = JSON.stringify([
  {
    type: 'paragraph',
    children: [{ text: '' }]
  }
])

export function pageUris(containerUri: string) {
  const docUri = `${containerUri}index.ttl`
  const uri = `${docUri}#Page`
  const subpageContainerUri = `${containerUri}pages/`
  return ({ containerUri, docUri, uri, subpageContainerUri })
}

export function newPage(parent: PageContainer, { name = "Untitled" } = {}): Page {
  const id = uuid()
  const { containerUri, docUri, uri, subpageContainerUri } = pageUris(`${parent.subpageContainerUri}${id}/`)
  return ({
    id,
    uri,
    docUri,
    containerUri,
    subpageContainerUri,
    name,
    text: initialPage
  })
}

const addPageMetadata = async (parent: PageContainer, page: Page) => {
  const childListItemUri = `${parent.docUri}#${page.id}`
  const childListItemNode = data[childListItemUri]
  await Promise.all([
    childListItemNode[rdf.type].set(namedNode(schema.ListItem)),
    childListItemNode[schema.item].set(namedNode(page.uri)),
    childListItemNode[schema.name].set(page.name)
  ])
  return { inListItem: childListItemNode, ...page }
}

export const addPage = async (parent: PageContainer, pageProps = {}) => {
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

export const addSubPage = async (pageListItem: PageListItem, pageProps = {}) => {
  const parentPage = await pageResolver(pageListItem.pageNode)
  return await addPage(parentPage, pageProps)
}

export function workspaceFromStorage(storage: string) {
  const conceptContainer = conceptContainerUrl(storage)
  const publicPages = publicPagesUrl(conceptContainer)
  const workspaceContainer = `${conceptContainer}workspace/`
  const workspaceDoc = `${workspaceContainer}index.ttl`
  return ({
    conceptContainer,
    containerUri: workspaceContainer,
    docUri: workspaceDoc,
    uri: `${workspaceDoc}#Workspace`,
    subpageContainerUri: `${workspaceContainer}pages/`,
    publicPages
  })

}

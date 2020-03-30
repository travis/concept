import uuid from 'uuid/v1';
import { schema, rdf, dc } from 'rdf-namespaces';
import data from '@solid/query-ldflex';
import { namedNode, literal } from '@rdfjs/data-model';
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
  text: string,
  inListItem: string,
  imageContainerUri: string,
  parent: string
}

export interface PageListItem {
  uri: string,
  name: string,
  pageUri: string
}

export interface PageProps {
  name?: string
}

export interface PageListItemProps {
  position?: number
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
  const imageContainerUri = `${containerUri}images/`
  return ({ containerUri, docUri, uri, subpageContainerUri, imageContainerUri })
}

export function newPage(parent: PageContainer, { name = "Untitled" } = {}): Page {
  const id = uuid()
  const inListItem = `${parent.docUri}#${id}`
  return ({
    id,
    name,
    text: initialPage,
    inListItem,
    parent: parent.uri,
    ...pageUris(`${parent.subpageContainerUri}${id}/`)
  })
}

const addPageMetadata = async (parent: PageContainer, page: Page, props: PageListItemProps = {}) => {
  const childListItemNode = data[page.inListItem]
  await Promise.all([
    childListItemNode[rdf.type].set(namedNode(schema.ListItem)),
    childListItemNode[schema.item].set(namedNode(page.uri)),
    childListItemNode[schema.name].set(page.name),
    childListItemNode[schema.position].set(literal(`${props.position || 0}`, "http://www.w3.org/2001/XMLSchema#int"))
  ])
  return page
}

export const addPage = async (parent: PageContainer, pageProps = {}, pageListItemProps = {}) => {
  const barePage = newPage(parent, pageProps)
  await createNonExistentDocument(barePage.docUri)
  const page = await addPageMetadata(parent, barePage, pageListItemProps)
  const pageNode = data[page.uri]
  await Promise.all([
    pageNode[rdf.type].set(namedNode(schema.DigitalDocument)),
    pageNode[dc.identifier].set(page.id),
    pageNode[schema.text].set(page.text),
    pageNode[schema.name].set(page.name),
    pageNode[concept.parent].set(namedNode(parent.uri)),
    pageNode[concept.inListItem].set(page.inListItem)
  ])
  await data[parent.uri][schema.itemListElement].add(namedNode(page.inListItem))
  return page
}

export const addSubPage = async (pageListItem: PageListItem, pageProps = {}, pageListItemProps = {}) => {
  const parentPage = await pageResolver(data[pageListItem.pageUri])
  return await addPage(parentPage, pageProps, pageListItemProps)
}

export function workspaceFromStorage(storage: string): Workspace {
  const conceptContainer = conceptContainerUrl(storage)
  const publicPages = publicPagesUrl(conceptContainer)
  const workspaceContainer = `${conceptContainer}workspace/`
  const workspaceDoc = `${workspaceContainer}index.ttl`
  return ({
    containerUri: workspaceContainer,
    docUri: workspaceDoc,
    uri: `${workspaceDoc}#Workspace`,
    subpageContainerUri: `${workspaceContainer}pages/`,
    publicPages
  })

}

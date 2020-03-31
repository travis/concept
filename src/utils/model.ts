import uuid from 'uuid/v1';
import { schema, rdf, dc } from 'rdf-namespaces';
import data from '@solid/query-ldflex';
import { createDocument, patchDocument } from './ldflex-helper';
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
  parent: string,
  metaUri: string
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

export function metaForPageUri(pageUri: string) {
  return `${pageUri.split("/").slice(0, -1).join("/")}/.meta`
}

export function pageUris(containerUri: string) {
  const docUri = `${containerUri}index.ttl`
  const metaUri = `${containerUri}.meta`
  const uri = `${docUri}#Page`
  const subpageContainerUri = `${containerUri}pages/`
  const imageContainerUri = `${containerUri}images/`
  return ({ containerUri, docUri, uri, subpageContainerUri, imageContainerUri, metaUri })
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
  await Promise.all([
    patchDocument(parent.docUri, `
INSERT DATA {
<${page.inListItem}>
  <${rdf.type}> <${schema.ListItem}> ;
  <${schema.item}> <${page.uri}> ;
  <${schema.name}> """${page.name}""" ;
  <${schema.position}> "${props.position || 0}"^^<http://www.w3.org/2001/XMLSchema#int> .
<${parent.uri}> <${schema.itemListElement}> <${page.inListItem}> .
}
`),
    createDocument(page.metaUri, `
<${page.uri}> <${schema.name}> """${page.name}""" .
`)
  ])
  return page
}

export const addPage = async (parent: PageContainer, pageProps = {}, pageListItemProps = {}) => {
  const page = newPage(parent, pageProps)
  await createDocument(page.docUri, `
<${page.uri}>
   <${rdf.type}> <${schema.DigitalDocument}> ;
   <${dc.identifier}> "${page.id}" ;
   <${schema.text}> """${page.text}""" ;
   <${schema.name}> """${page.name}""" ;
   <${concept.parent}> <${parent.uri}> ;
   <${concept.inListItem}> <${page.inListItem}> .
`)
  await addPageMetadata(parent, page, pageListItemProps)
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

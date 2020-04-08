import uuid from 'uuid/v1';
import { schema, rdf, dc, dct } from 'rdf-namespaces';
import data from '@solid/query-ldflex';
import { resourceExists, createDocument, patchDocument } from './ldflex-helper';
import cpt from '../ontology';
import { pageResolver } from './data';
import { conceptContainerUrl, publicPagesUrl } from '../utils/urls';

export interface Subject {
  uri: string,
  docUri: string,
  containerUri: string
}

export interface PageContainer extends Subject {
  subpageContainerUri: string
}

export interface Document extends Subject {
  id: string,
  name: string,
  text: string,
  imageContainerUri: string,
  metaUri: string
}

export interface Workspace extends PageContainer {
  publicPages: string,
  conceptContainerUri: string
}

export interface Concept extends Document {

}

export interface Page extends PageContainer, Document {
  inListItem: string,
  parent: string,
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

const initialDocumentText = JSON.stringify([
  {
    type: 'paragraph',
    children: [{ text: '' }]
  }
])

export function conceptUris(containerUri: string) {
  const docUri = `${containerUri}index.ttl`
  const metaUri = `${containerUri}.meta`
  const uri = `${docUri}#Concept`
  const imageContainerUri = `${containerUri}images/`
  return ({ containerUri, docUri, uri, imageContainerUri, metaUri })
}

export function newConcept(workspace: Workspace, name: string): Concept {
  const id = encodeURIComponent(name)
  return ({
    id,
    name,
    text: initialDocumentText,
    ...conceptUris(`${workspace.conceptContainerUri}${id}/`)
  })
}

export const addConcept = async (workspace: Workspace, name: string, referencedBy: string) => {
  const concept = newConcept(workspace, name)
  await createDocument(concept.docUri, `
<${concept.uri}>
  <${rdf.type}> <${schema.DigitalDocument}> ;
  <${dc.identifier}> "${concept.id}" ;
  <${schema.text}> """${concept.text}""" ;
  <${schema.name}> """${concept.name}""" ;
  <${dct.isReferencedBy}> <${referencedBy}> ;
  <${cpt.parent}> <${workspace.uri}> .
`)
  return concept
}

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
    text: initialDocumentText,
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
  <${cpt.parent}> <${parent.uri}> ;
  <${cpt.inListItem}> <${page.inListItem}> .
`)
  await addPageMetadata(parent, page, pageListItemProps)
  return page
}

const conceptDocFromConceptUri = (conceptUri: string) =>
  conceptUri.split("#").slice(0, -1).join("")

const conceptNameFromConceptUri = (conceptUri: string) =>
  decodeURIComponent(conceptUri.split("/").slice(-2)[0])

const addConceptReferencedBy = async (workspace: Workspace, docUri: string, conceptUri: string) => {
  const resourceUri = conceptDocFromConceptUri(conceptUri)
  if (await resourceExists(resourceUri)) {
    await patchDocument(resourceUri, `
INSERT DATA {
<${conceptUri}> <${dct.isReferencedBy}> <${docUri}>
}
`)
  } else {
    await addConcept(workspace, conceptNameFromConceptUri(conceptUri), docUri)
  }
}

const addConceptReferencedBys = async (workspace: Workspace, docUri: string, conceptUris: string[]) => {
  await Promise.all(conceptUris.map(
    conceptUri => addConceptReferencedBy(workspace, docUri, conceptUri)
  ))
}

const deleteConceptReferencedBy = async (docUri: string, conceptUri: string) => {
  await patchDocument(conceptDocFromConceptUri(conceptUri), `
DELETE DATA {
<${conceptUri}> <${dct.isReferencedBy}> <${docUri}>
}
`)
}

const deleteConceptReferencedBys = async (docUri: string, conceptUris: string[]) => {
  await Promise.all(conceptUris.map(
    conceptUri => deleteConceptReferencedBy(docUri, conceptUri)
  ))
}

const referenceDoubles = (references: string[]) =>
  references.map(reference => `<${dct.references}> <${reference}> ;`)

export const setDocumentText = async (workspace: Workspace, doc: Document, newText: string, referencesToAdd: string[], referencesToDelete: string[]) => {
  await Promise.all([
    patchDocument(doc.docUri, `
DELETE DATA {
<${doc.uri}>
  ${referenceDoubles(referencesToDelete)}
  <${schema.text}> """${doc.text}""" .
} ;
INSERT DATA {
<${doc.uri}>
  ${referenceDoubles(referencesToAdd)}
  <${schema.text}> """${newText}""" .
}
`),
    deleteConceptReferencedBys(doc.uri, referencesToDelete),
    addConceptReferencedBys(workspace, doc.uri, referencesToAdd)
  ])
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
    conceptContainerUri: `${workspaceContainer}concepts/`,
    publicPages
  })

}

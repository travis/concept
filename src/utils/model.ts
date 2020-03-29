import uuid from 'uuid/v1';

export interface PageContainer {
  uri: string,
  docUri: string,
  containerUri: string,
  subpageContainerUri: string
}

export interface Workspace extends PageContainer {
}

export interface Page extends PageContainer {
  id: string,
  name: string,
  text: string
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

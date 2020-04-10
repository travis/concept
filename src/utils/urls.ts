import base32 from 'base32'

export const conceptContainerUrl = (storage: string) => `${storage}private/concept/v5.12/`
export const appContainerUrl = conceptContainerUrl
export const publicPagesUrl = (conceptContainer: string) => `${conceptContainer}publicPages.ttl`
export const pagePath = (page: string) => `/page/${encodeURIComponent(page)}`
export const sharingUrl = (page: string) => `https://useconcept.art${pagePath(page)}`
export const webIdProfilePath = (webId: string) => `/webid/${encodeURIComponent(webId)}`
export const handleProfilePath = (handle: string) => `/for/${handle}`
export const handleHausUriForWebId = (webId: string) => `https://handle.haus/webids/${encodeURIComponent(webId)}#Person`

export const conceptNameToUrlSafeId = (name: string) =>
  base32.encode(encodeURIComponent(name))
export const urlSafeIdToConceptName = (id: string) =>
  decodeURIComponent(base32.decode(id))

export const conceptPath = (conceptUri: string) => `/concept/${encodeURIComponent(conceptUri)}`
export const conceptUrl = (conceptUri: string) => {
  const u = new URL(window.location.toString())
  u.pathname = conceptPath(conceptUri)
  return u.toString()
}
export const conceptUri = (container: string, name: string) => `${container}${conceptNameToUrlSafeId(name)}/index.ttl#Concept`
export const documentPath = (documentUri: string) => {
  if (documentUri.endsWith("Concept")) {
    return conceptPath(documentUri)
  } else if (documentUri.endsWith("Page")) {
    return pagePath(documentUri)
  }
}

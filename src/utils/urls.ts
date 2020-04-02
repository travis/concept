export const conceptContainerUrl = (storage: string) => `${storage}private/concept/v5.0/`
export const appContainerUrl = conceptContainerUrl
export const publicPagesUrl = (conceptContainer: string) => `${conceptContainer}publicPages.ttl`
export const pagePath = (page: string) => `/page/${encodeURIComponent(page)}`
export const sharingUrl = (page: string) => `https://useconcept.art${pagePath(page)}`
export const webIdProfilePath = (webId: string) => `/webid/${encodeURIComponent(webId)}`
export const handleProfilePath = (handle: string) => `/for/${handle}`
export const conceptPagePath = (pageUri: string) => {
  const encodedPage = pageUri && encodeURIComponent(pageUri)
  return `/page/${encodedPage}`
}
export const handleHausUriForWebId = (webId: string) => `https://handle.haus/webids/${encodeURIComponent(webId)}#Person`

export const conceptContainerUrl = (storage: string) => `${storage}concept/v3.18/`
export const appContainerUrl = conceptContainerUrl
export const publicPagesUrl = (conceptContainer: string) => `${conceptContainer}publicPages.ttl`
export const sharingUrl = (page: string) => `https://useconcept.art/page/${encodeURIComponent(page)}`
export const conceptPagePath = (pageUri: string) => {
  const encodedPage = pageUri && encodeURIComponent(pageUri)
  return `/page/${encodedPage}`
}

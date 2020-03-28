export const conceptContainerUrl = (storage) => `${storage}concept/v2.0/`
export const publicPagesUrl = (conceptContainer) => `${conceptContainer}publicPages.ttl`
export const sharingUrl = (page) => `https://useconcept.art/page/${encodeURIComponent(page)}`

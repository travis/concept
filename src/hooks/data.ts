import { useEffect, useState, useMemo } from 'react';
import { useWebId, useLDflexValue, useLiveUpdate } from '@solid/react';
import { space, schema } from 'rdf-namespaces';
import { appContainerUrl } from '../utils/urls';
import { listResolver, pageListItemsResolver, pageResolver } from '../utils/data';
import data from '@solid/query-ldflex';
import { Page, PageContainer, PageListItem } from '../utils/model'

export function useAppContainer() {
  const webId = useWebId();
  const storage = useLDflexValue(`[${webId}][${space.storage}]`);
  return storage && appContainerUrl(storage)
}

export function useWorkspace() {
  const appContainer = useAppContainer()
  const workspace = useMemo(() => {
    const workspaceContainer = appContainer && `${appContainer}workspace/`
    const docUri = workspaceContainer && `${workspaceContainer}index.ttl`
    return docUri && {
      docUri,
      uri: `${docUri}#Workspace`,
      containerUri: workspaceContainer,
      subpageContainerUri: `${workspaceContainer}pages/`
    }
  }, [appContainer]);
  return workspace
}

type QueryUri = string | undefined

export function useQuery<T>(resolver: (query: any) => Promise<T>, ...queryUris: QueryUri[]): [T | undefined, boolean, Error | undefined] {
  const resourceUri = queryUris[0]
  const { url: updatedUri, timestamp } = useLiveUpdate()
  const [updatedTimestamp, setUpdatedTimestamp] = useState(timestamp)
  useEffect(() => {
    if (resourceUri) {
      const url = new URL(resourceUri)
      url.hash = ''
      const docUri = url.toString()
      if (updatedUri === docUri) {
        setUpdatedTimestamp(timestamp)
      }
    }
  }, [resourceUri, updatedUri, timestamp])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState()
  const [result, setResult] = useState<T>()
  useEffect(() => {
    if (queryUris.reduce((u: any, m: any) => u && m, true)) {
      const updateResult = async () => {
        setLoading(true)
        try {
          // seatbelts off on this next line because we already made sure all the uris aren't undefined
          setResult(await resolver(queryUris.reduce((m: any, uri: any) => m[uri], data)))
        } catch (e) {
          setError(e)
        }
        setLoading(false)
      }
      updateResult()
    }
  }, [...queryUris, updatedTimestamp]) //eslint-disable-line
  return [result, loading, error]
}

export function useListQuery(...queryUris: string[]) {
  return useQuery(listResolver, ...queryUris)
}

export function usePageListItems(parent: PageContainer | undefined) {
  const [items] = useQuery(pageListItemsResolver, parent && parent.uri, schema.itemListElement)
  return items
}

export function usePageFromPageListItem(pageListItem: PageListItem) {
  const [items] = useQuery(pageResolver, pageListItem && pageListItem.pageNode.value)
  return items
}

export function usePage(pageUri: string | undefined): [Page | undefined, boolean, Error | undefined] {
  return useQuery(pageResolver, pageUri)
}

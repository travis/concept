import { useEffect, useState, useMemo, useCallback } from 'react';
import { useWebId, useLDflexValue, useLiveUpdate } from '@solid/react';
import { dc, space, schema } from 'rdf-namespaces';
import { appContainerUrl, publicPagesUrl } from '../utils/urls';
import { pageUrisFromPageUri, listResolver, pageListItemsResolver, pageResolver } from '../utils/data';
import data from '@solid/query-ldflex';

export function useAppContainer() {
  const webId = useWebId();
  const storage = useLDflexValue(`[${webId}][${space.storage}]`);
  return storage && appContainerUrl(storage)
}

export function useWorkspace(){
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

export function useQuery(resolver, ...queryUris){
  const resourceUri = queryUris[0]
  const {url: updatedUri, timestamp} = useLiveUpdate()
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
  const [result, setResult] = useState()
  useEffect(() => {
    if (queryUris.reduce((u, m) => u && m, true)) {
      async function updateResult(){
        setLoading(true)
        try {
          setResult(await resolver(queryUris.reduce((m, u) => m[u], data)))
        } catch(e) {
          setError(e)
        }
        setLoading(false)
      }
      updateResult()
    }
  }, [...queryUris, updatedTimestamp]) //eslint-disable-line
  return [result, loading, error]
}

export function useListQuery(...queryUris){
  return useQuery(listResolver, ...queryUris)
}

export function usePageListItems(parent){
  const [items] = useQuery(pageListItemsResolver, parent && parent.uri, schema.itemListElement)
  return items
}

export function usePageFromPageListItem(pageListItem){
  const [items] = useQuery(pageResolver, pageListItem && pageListItem.pageNode.value)
  return items
}

export function usePage(pageUri){
  return useQuery(pageResolver, pageUri)
}

import React, { ReactNode, createContext, useCallback, useEffect, useMemo } from 'react';
import { space, schema } from 'rdf-namespaces';
import { useWebId, useLDflexValue } from '@solid/react';
import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { createNonExistentDocument } from '../utils/ldflex-helper';
import { createDefaultAcl } from '../utils/acl';
import { listResolver } from '../utils/data';
import * as m from "../utils/model"

type AddPageType = (props: m.PageProps, pageListProps: m.PageListItemProps) => Promise<m.Page | null>
type AddSubPageType = (props: m.PageProps, parentPageListItem: m.PageListItem) => Promise<m.Page | null>
type UpdatePageType = (page: m.Page, predicate: string, value: any) => Promise<void>
type DeletePageType = (page: m.Page) => Promise<void>

export interface WorkspaceContextType {
  conceptContainer?: string,
  publicPages?: string,
  workspace?: m.Workspace,
  addPage?: AddPageType,
  addSubPage?: AddSubPageType,
  updatePage?: UpdatePageType,
  deletePage?: DeletePageType
}

const WorkspaceContext = createContext<WorkspaceContextType>({});

const { Provider } = WorkspaceContext;

type WorkspaceProviderProps = {
  children: ReactNode
}

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const webId = useWebId();
  const storage: any = useLDflexValue(`[${webId}][${space.storage}]`);
  const workspace = useMemo(
    () => (storage === undefined) ? undefined : m.workspaceFromStorage(storage.value as string),
    [storage]
  )

  useEffect(() => {
    if (workspace && workspace.docUri) {
      const createWorkspace = async () => {
        await createNonExistentDocument(workspace.docUri);
      }
      createWorkspace();
    }
  }, [workspace])

  const addPage: AddPageType = async ({ name = "Untitled" }, pageListItemProps) => {
    if (workspace !== undefined) {
      const page = await m.addPage(workspace, { name }, pageListItemProps)
      await createDefaultAcl(webId, page.containerUri)
      return page
    } else {
      return null
    }
  }

  const addSubPage: AddSubPageType = async ({ name = "Untitled" }, parentPageListItem) => {
    const subPageList = await listResolver(data[parentPageListItem.pageUri][schema.itemListElement])
    return await m.addSubPage(parentPageListItem, { name }, { position: subPageList.length })
  }

  const updatePage = useCallback(async (page: m.Page, predicate: string, value: string) => {
    if (predicate === schema.name) {
      await Promise.all([
        data[page.uri][predicate].set(value),
        data[page.inListItem][predicate].set(value),
        data.from(page.metaUri)[page.uri][predicate].set(value)
      ])
    } else if (predicate === schema.text) {
      await data[page.uri][predicate].set(value)
    }
  }, [])

  const deletePage = useCallback(async (page: m.Page) => {
    await data[page.parent][schema.itemListElement].delete(namedNode(page.inListItem))
  }, [])

  return (
    <Provider value={{ workspace, addPage, addSubPage, updatePage, deletePage }
    }
      children={children} />
  )
}

export default WorkspaceContext;

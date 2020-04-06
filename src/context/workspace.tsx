import React, { ReactNode, createContext, useCallback, useEffect, useMemo } from 'react';
import { space, schema } from 'rdf-namespaces';
import { useWebId } from '@solid/react';
import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { createNonExistentDocument } from '../utils/ldflex-helper';
import { createDefaultAcl } from '../utils/acl';
import { listResolver } from '../utils/data';
import { useValueQuery } from '../hooks/data';
import * as m from "../utils/model"

type AddPageType = (props: m.PageProps, pageListProps: m.PageListItemProps) => Promise<m.Page | null>
type AddSubPageType = (props: m.PageProps, parentPageListItem: m.PageListItem) => Promise<m.Page | null>
type UpdateTextType = (document: m.Document, value: any) => Promise<void>
type UpdateNameType = (page: m.Page, value: any) => Promise<void>
type DeletePageType = (page: m.Page) => Promise<void>

export interface WorkspaceContextType {
  conceptContainer?: string,
  publicPages?: string,
  workspace?: m.Workspace,
  addPage?: AddPageType,
  addSubPage?: AddSubPageType,
  updateText?: UpdateTextType,
  updateName?: UpdateNameType,
  deletePage?: DeletePageType
}

const WorkspaceContext = createContext<WorkspaceContextType>({});

const { Provider } = WorkspaceContext;

type WorkspaceProviderProps = {
  children: ReactNode
}

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const webId = useWebId();
  const [storage] = useValueQuery(webId, space.storage)
  const workspace = useMemo(
    () => (storage === undefined) ? undefined : m.workspaceFromStorage(storage),
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

  const updateName = useCallback(async (page: m.Page, value: string) => {
    await Promise.all([
      data[page.uri][schema.name].set(value),
      data[page.inListItem][schema.name].set(value),
      data.from(page.metaUri)[page.uri][schema.name].set(value)
    ])
  }, [])

  const updateText = useCallback(async (doc: m.Document, value: string) => {
    await data[doc.uri][schema.text].set(value)
  }, [])

  const deletePage = useCallback(async (page: m.Page) => {
    await data[page.parent][schema.itemListElement].delete(namedNode(page.inListItem))
  }, [])

  return (
    <Provider value={{ workspace, addPage, addSubPage, updateText, updateName, deletePage }
    }
      children={children} />
  )
}

export default WorkspaceContext;

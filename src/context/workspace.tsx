import React, { FunctionComponent, ReactNode, createContext, useCallback, useEffect, useMemo } from 'react';
import { space, schema } from 'rdf-namespaces';
import { useWebId, useLDflexValue } from '@solid/react';
import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { createNonExistentDocument, deleteFile } from '../utils/ldflex-helper';
import { createDefaultAcl } from '../utils/acl';
import concept from '../ontology'
import * as m from "../utils/model"

type AddPageType = (props: m.PageProps) => Promise<void>
type AddSubPageType = (parentPageListItem: m.PageListItem, props: m.PageProps) => Promise<void>
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

export const WorkspaceProvider: FunctionComponent<WorkspaceProviderProps> = ({ children }) => {
  const webId = useWebId();
  const storage: any = useLDflexValue(`[${webId}][${space.storage}]`);
  const workspace = useMemo(
    () => (storage === undefined) ? undefined : m.workspaceFromStorage(storage.value as string)
    , [storage])

  useEffect(() => {
    console.log("workspace changed")
    if (workspace && workspace.docUri) {
      const createWorkspace = async () => {
        await createNonExistentDocument(workspace);
      }
      createWorkspace();
    }
  }, [workspace])

  const addPage: AddPageType = async ({ name = "Untitled" } = {}) => {
    if (workspace !== undefined) {
      const page = await m.addPage(workspace, { name })
      await createDefaultAcl(webId, page.containerUri)
    }
  }

  const addSubPage: AddSubPageType = async (parentPageListItem, { name = "Untitled" } = {}) => {
    await m.addSubPage(parentPageListItem, { name })
  }

  const updatePage = useCallback(async (page, predicate, value) => {
    if (predicate === schema.name) {
      await Promise.all([
        data[page.uri][predicate].set(value),
        data[page.inListItem.value][predicate].set(value)
      ])
    } else if (predicate === schema.text) {
      await data[page][predicate].set(value)
    }
  }, [])

  const deletePage = useCallback(async (pageUriOrNode) => {
    const parent = await data[pageUriOrNode][concept.parent]
    const page = namedNode(pageUriOrNode.toString())
    await Promise.all([
      data[parent][schema.itemListElement].delete(page),
      data.from(parent)[page.value][schema.name].delete(),
      deleteFile(page.value)
    ])
  }, [])
  return (
    <Provider value={{ workspace, addPage, addSubPage, updatePage, deletePage }
    }
      children={children} />
  )
}

export default WorkspaceContext;

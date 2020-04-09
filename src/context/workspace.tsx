import React, { ReactNode, createContext, useCallback, useEffect, useMemo } from 'react';
import { space, schema, dct } from 'rdf-namespaces';
import { useWebId } from '@solid/react';
import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { createNonExistentDocument } from '../utils/ldflex-helper';
import { createDefaultAcl } from '../utils/acl';
import { listResolver, listValuesResolver } from '../utils/data';
import { useValueQuery } from '../hooks/data';
import * as m from "../utils/model"

type AddPageType = (props: m.PageProps, pageListProps: m.PageListItemProps) => Promise<m.Page | null>
type AddConceptType = (props: m.ConceptProps) => Promise<m.Concept | null>
type AddSubPageType = (props: m.PageProps, parentPageListItem: m.PageListItem) => Promise<m.Page | null>
type UpdateTextType = (document: m.Document, value: string, conceptUris: string[]) => Promise<void>
type UpdateNameType = (page: m.Page, value: any) => Promise<void>
type DeleteDocumentType = (document: m.Document) => Promise<void>

export interface WorkspaceContextType {
  conceptContainer?: string,
  publicPages?: string,
  workspace?: m.Workspace,
  addPage?: AddPageType,
  addConcept?: AddConceptType,
  addSubPage?: AddSubPageType,
  updateText?: UpdateTextType,
  updateName?: UpdateNameType,
  deleteDocument?: DeleteDocumentType
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
        Promise.all([
          createNonExistentDocument(workspace.docUri),
          createDefaultAcl(webId, workspace.containerUri)
        ])
      }
      createWorkspace();
    }
  }, [workspace, webId])

  const addPage: AddPageType = async ({ name = "Untitled" }, pageListItemProps) => {
    if (workspace !== undefined) {
      return await m.addPage(workspace, { name }, pageListItemProps)
    } else {
      return null
    }
  }

  const addConcept: AddConceptType = async ({ name }) => {
    if (workspace !== undefined) {
      return await m.addConcept(workspace, name)
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

  const updateText = useCallback(async (doc: m.Document, value: string, conceptUris: string[]) => {
    const conceptUrisSet = new Set(conceptUris)
    const references: string[] = await listValuesResolver(data[doc.uri][dct.references])
    const referencesSet = new Set(references)
    const toAdd = conceptUris.filter(x => !referencesSet.has(x))
    const toDelete = references.filter(x => !conceptUrisSet.has(x))
    if (workspace) {
      await m.setDocumentText(workspace, doc, value, toAdd, toDelete)
    }

  }, [workspace])

  const deleteDocument = useCallback(async (document: m.Document) => {
    await data[document.parentUri][schema.itemListElement].delete(namedNode(document.inListItem))
  }, [])

  return (
    <Provider value={{ workspace, addPage, addConcept, addSubPage, updateText, updateName, deleteDocument }
    }
      children={children} />
  )
}

export default WorkspaceContext;

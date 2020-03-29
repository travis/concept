import React, {createContext, useCallback, useEffect, useMemo} from 'react';
import {space, schema} from 'rdf-namespaces';
import {useWebId, useLDflexValue} from '@solid/react';
import data from '@solid/query-ldflex';
import {namedNode} from '@rdfjs/data-model';
import uuid from 'uuid/v1';
import { createNonExistentDocument, deleteFile } from '../utils/ldflex-helper';
import { createDefaultAcl } from '../utils/acl';
import { conceptContainerUrl, publicPagesUrl } from '../utils/urls';
import concept from '../ontology'
import * as model from "../utils/data"

const WorkspaceContext = createContext({});

const {Provider} = WorkspaceContext;

const initialPage = JSON.stringify([
  {
    type: 'paragraph',
    children: [{text: ''}]
  }
])

export const WorkspaceProvider = (props) => {
  const webId = useWebId();
  const storage = useLDflexValue(`[${webId}][${space.storage}]`);
  const conceptContainer = storage && conceptContainerUrl(storage)
  const publicPages = conceptContainer && publicPagesUrl(conceptContainer)
  const workspaceContainer = conceptContainer && `${conceptContainer}workspace/`
  const workspaceDoc = workspaceContainer && `${workspaceContainer}index.ttl`
  const workspace = useMemo(() => workspaceDoc && ({
    docUri: workspaceDoc,
    uri: `${workspaceDoc}#Workspace`,
    subpageContainerUri: `${workspaceContainer}pages/`
  }), [workspaceDoc, workspaceContainer])

  useEffect(() => {
    if (workspaceDoc) {
      const createWorkspace = async () => {
        await createNonExistentDocument(workspaceDoc);
      }
      createWorkspace();
    }
  }, [workspaceDoc])

  const addPage = async ({name="Untitled"}={}) => {
    const page = await model.addPage(workspace, {name})
    await createDefaultAcl(webId, page.containerUri)
  }

  const addSubPage = async (parentPageListItem, {name="Untitled", parent}={}) => {
    await model.addSubPage(parentPageListItem, {name})
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
    <Provider {...props} value={{conceptContainer, publicPages, workspace, addPage, addSubPage, updatePage, deletePage}} />
  )
}

export default WorkspaceContext;

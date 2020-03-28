import React, {createContext, useCallback, useEffect} from 'react';
import {space, schema} from 'rdf-namespaces';
import {useWebId, useLDflexValue} from '@solid/react';
import data from '@solid/query-ldflex';
import {namedNode} from '@rdfjs/data-model';
import uuid from 'uuid/v1';
import { createNonExistentDocument, deleteFile } from '../utils/ldflex-helper';
import { createDefaultAcl } from '../utils/acl';
import concept from '../ontology'

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
  const conceptContainer = `${storage}concept/v2.0/`;
  const publicPages = `${conceptContainer}publicPages.ttl`;
  const workspaceFile = 'workspace/index.ttl';
  const workspace = storage && `${conceptContainer}${workspaceFile}`;

  useEffect(() => {
    if (workspace) {
      const createWorkspace = async () => {
        await createNonExistentDocument(workspace);
      }
      createWorkspace();
    }
  }, [workspace])

  const addPage = async ({name="Untitled", parent=workspace}={}) => {
    const id = uuid();
    const pageContainer = `${parent.toString().split("/").slice(0, -1).join("/")}/pages/${id}/`
    const pageRef = `${pageContainer}index.ttl`;
    await createNonExistentDocument(pageRef);
    await Promise.all([
      data[pageRef][schema.text].set(initialPage),
      data[pageRef][schema.name].set(name),
      data[pageRef][concept.parent].set(namedNode(parent.toString())),
      data.from(parent)[pageRef][schema.name].set(name),
      data[parent][schema.itemListElement].add(namedNode(pageRef)),
    ]);
    if (parent === workspace){
      await createDefaultAcl(webId, pageContainer)
    }
  }

  const updatePage = useCallback(async (page, predicate, value) => {
    if (predicate === schema.name) {
      const parent = await data[page][concept.parent]
      await Promise.all([
        data[page][predicate].set(value),
        data.from(parent)[page][predicate].set(value)
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
    <Provider {...props} value={{conceptContainer, publicPages, workspace, addPage, updatePage, deletePage}} />
  )
}

export default WorkspaceContext;

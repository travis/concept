import React, {createContext, useCallback, useEffect} from 'react';
import {space, schema} from 'rdf-namespaces';
import {useWebId, useLDflexValue} from '@solid/react';
import data from '@solid/query-ldflex';
import {namedNode} from '@rdfjs/data-model';
import uuid from 'uuid/v1';
import {createNonExistentDocument, deleteFile} from '../utils/ldflex-helper';

const WorkspaceContext = createContext({});

const {Provider} = WorkspaceContext;

export const WorkspaceProvider = (props) => {
  const webId = useWebId();
  const storage = useLDflexValue(`[${webId}][${space.storage}]`);
  const conceptContainer = `${storage}public/conceptv3/`;
  const workspaceFile = 'workspace.ttl';
  const workspace = storage && `${conceptContainer}${workspaceFile}`;
  const container = storage && `${conceptContainer}workspace/`;

  useEffect(() => {
    if (workspace) {
      const createWorkspace = async () => {
        await createNonExistentDocument(workspace);
      }
      createWorkspace();
    }
  }, [workspace])

  const addPage = async (name="Untitled") => {
    const id = uuid();
    const pageRef = `${container}${id}`;
    await createNonExistentDocument(pageRef);
    await Promise.all([
      data[pageRef][schema.text].set(""),
      data.from(workspace)[pageRef][schema.name].set(name)
    ]);
    await data[workspace][schema.itemListElement].add(namedNode(pageRef));
  }

  const updatePage = useCallback(async (page, predicate, value) => {
    if (predicate === schema.name) {
      await data.from(workspace)[page][predicate].set(value);
    } else if (predicate === schema.text) {
      await data[page][predicate].set(value)
    }
  }, [workspace])

  const deletePage = useCallback(async (page) => {
    await Promise.all([
      data[workspace][schema.itemListElement].delete(page),
      data.from(workspace)[page][schema.name].delete(),
      deleteFile(page)
    ]);
  }, [workspace])

  return (
    <Provider {...props} value={{workspace, addPage, updatePage, deletePage}} />
  )
}

export default WorkspaceContext;

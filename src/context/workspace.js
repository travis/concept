import React, {createContext, useCallback} from 'react';
import {space, schema} from 'rdf-namespaces';
import {useWebId, useLDflexValue} from '@solid/react';
import data from '@solid/query-ldflex';
import {namedNode} from '@rdfjs/data-model';
import uuid from 'uuid/v1';

const WorkspaceContext = createContext({});

const {Provider} = WorkspaceContext;

export const WorkspaceProvider = (props) => {
  const webId = useWebId();
  const storage = useLDflexValue(`[${webId}][${space.storage}]`)
  const workspace = storage && `${storage}public/concept/workspace.ttl`;

  const addPage = async (name="Untitled") => {
    const id = "#" + uuid();
    await data[workspace][schema.itemListElement].add(namedNode(id))
    await data[`${workspace}${id}`][schema.name].set(name)
    await data[`${workspace}${id}`][schema.text].set("")
  }

  const updatePage = useCallback(async (page, predicate, value) => {
    await data[page][predicate].set(value)
  }, [])

  const deletePage = useCallback(async (page) => {
    await data[page][schema.name].delete()
    await data[page][schema.text].delete()
    await data[workspace][schema.itemListElement].delete(page)
  }, [workspace])

  return (
    <Provider {...props} value={{workspace, addPage, updatePage, deletePage}} />
  )
}

export default WorkspaceContext;

import React, {createContext, useCallback, useEffect} from 'react';
import {space, schema} from 'rdf-namespaces';
import {useWebId, useLDflexValue} from '@solid/react';
import data from '@solid/query-ldflex';
import {namedNode} from '@rdfjs/data-model';
import uuid from 'uuid/v1';
import { ACLFactory, AccessControlList } from '@inrupt/solid-react-components';
import {createNonExistentDocument, deleteFile} from '../utils/ldflex-helper';

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
  const conceptContainer = `${storage}concept/v1/`;
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
    const pageRef = `${container}${id}.ttl`;
    await createNonExistentDocument(pageRef);
    await Promise.all([
      data[pageRef][schema.text].set(initialPage),
      data.from(workspace)[pageRef][schema.name].set(name),
      data[pageRef][schema.name].set(name),
    ]);
    await data[workspace][schema.itemListElement].add(namedNode(pageRef));
    const acls = await ACLFactory.createNewAcl(webId, pageRef)
    await acls.createACL([{
      agents: webId,
      modes: [
        AccessControlList.MODES.READ,
        AccessControlList.MODES.WRITE,
        AccessControlList.MODES.CONTROL
      ]
    }, {
      agents: [],
      modes: [
        AccessControlList.MODES.READ,
        AccessControlList.MODES.WRITE
      ]
    }, {
      agents: [],
      modes: [
        AccessControlList.MODES.READ,
      ]
    }])
  }

  const updatePage = useCallback(async (page, predicate, value) => {
    if (predicate === schema.name) {
      await data.from(workspace)[page][predicate].set(value);
      await data[page][predicate].set(value);
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

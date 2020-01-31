import React, {useEffect, useState, createContext, useContext, useCallback} from 'react';
import {fetchDocument, createDocument, createDocumentInContainer} from 'tripledoc';
import {space, rdf, solid, schema, ldp} from 'rdf-namespaces';
import client from 'solid-auth-client';

import AuthContext from '../context/auth'

const WorkspaceContext = createContext({});

const {Provider} = WorkspaceContext;

async function deleteResource(resourceRef) {
  const options = {
    body: '',
    // Make sure to include credentials with the request, set by solid-auth-client:
    credentials: 'include',
    //    headers: {
    //'Content-Type': 'text/turtle'
    //    },
    method: 'DELETE',
  };
  return client.fetch(resourceRef, options);
};

async function initializeWorkspace(profile, typeIndex) {
  // Get the root URL of the user's Pod:
  const storage = profile.getRef(space.storage);

  // Decide at what URL within the user's Pod the new Document should be stored:
  const workspaceRef = storage + 'public/concept/workspace.ttl';
  const workspaceContainerRef = storage + 'public/concept/workspace/';
  // Create the new Document:
  const workspaceDoc = createDocument(workspaceRef);
  const workspace = workspaceDoc.getSubject(workspaceRef)
  workspace.addRef(space.storage, workspaceContainerRef)
  const savedWorkspace = await workspaceDoc.save();

  // Store a reference to that Document in the public Type Index for `schema:DigitalDocument`:
  const typeRegistration = typeIndex.addSubject();
  typeRegistration.addRef(rdf.type, solid.TypeRegistration)
  typeRegistration.addRef(solid.instance, workspace.asRef())
  typeRegistration.addRef(solid.forClass, schema.DigitalDocument)
  await typeIndex.save([ typeRegistration ]);

  // And finally, return our newly created (currently empty) pages Document:
  return savedWorkspace;
}

async function getWorkspace(profile) {
  /* 1. Check if a Document tracking our pages already exists. */
  const publicTypeIndexRef = profile.getRef(solid.publicTypeIndex);
  const publicTypeIndex = await fetchDocument(publicTypeIndexRef);
  const workspaceEntry = publicTypeIndex.findSubject(solid.forClass, schema.DigitalDocument);

  /* 2. If it doesn't exist, create it. */
  if (workspaceEntry === null) {
    // We will define this function later:
    return initializeWorkspace(profile, publicTypeIndex);
  }

  /* 3. If it does exist, fetch that Document. */
  const workspaceRef = workspaceEntry.getRef(solid.instance);
  return await fetchDocument(workspaceRef);
}

export const WorkspaceProvider = (props) => {
  const [workspace, setWorkspace] = useState(null)
  const [container, setContainer] = useState(null)
  const [pages, setPages] = useState(null)
  const {currentUser} = useContext(AuthContext)

  const updateWorkspace = useCallback(async function updateWorkspace(newWorkspace) {
    setWorkspace(newWorkspace)
    console.log(newWorkspace.getSubject(newWorkspace.asRef()))
    const containerRef = newWorkspace.getSubject(newWorkspace.asRef()).getRef(space.storage);
    console.log("CONT", containerRef)
    const containerDoc = await fetchDocument(containerRef)
    const c = containerDoc.getSubject(containerDoc.asRef());
    console.log("setting container", c)
    setContainer(c)
    setPages(c.getAllRefs(ldp.contains))
  }, [])

  useEffect(() => {
    const loadPagesList = async () => {
      console.log("loading..")
      const workspaceDoc = await getWorkspace(currentUser)
      await updateWorkspace(workspaceDoc)
    }
    if (currentUser) loadPagesList()
  }, [currentUser, updateWorkspace])

  const addPage = useCallback(async function addPage(name="Untitled") {
    console.log(container)
    const pageDoc = await createDocumentInContainer(container.asRef()).save()
    const newPage = pageDoc.getSubject(pageDoc.asRef())
    newPage.addLiteral(schema.name, name);
    newPage.addLiteral(schema.text, '');
    const savedPageDoc = await pageDoc.save([newPage])


    const workspacePageMeta = workspace.getSubject(savedPageDoc.asRef());
    workspacePageMeta.setLiteral(schema.name, name)
    const updatedWorkspaceDoc = await workspace.save([workspacePageMeta]);

    //console.log("NEWNEW", newPageDoc.getSubject())
    //console.log("NEW", savedPageDoc.asRef())
    // Initialise the new Subject:
    //const newPage = workspace.addSubject(newPageDoc.asRef());

    // Indicate that the Subject is a schema:DigitalDocument:
    //newPage.addRef(rdf.type, schema.DigitalDocument);

    // Set the Subject's `schema:headline` to the actual page contents:
    //newPage.addLiteral(schema.name, name);

    // Store the date the page was created (i.e. now):
    //newPage.addLiteral(schema.dateCreated, new Date(Date.now()))

    //const updatedWorkspaceDoc = await workspace.save([newPage]);
    updateWorkspace(updatedWorkspaceDoc)
    return savedPageDoc.getSubject(savedPageDoc.asRef())
    //return newPage;
  }, [workspace, container, updateWorkspace]);

  const updatePage = useCallback(async function updatePage(page) {
    const updatedWorkspaceDoc = await workspace.save([page]);
    updateWorkspace(updatedWorkspaceDoc)
    return page;
  }, [workspace, updateWorkspace]);

  const deletePage = useCallback(async function deletePage(ref) {
    await deleteResource(ref);
    // Initialise the new Subject:
    workspace.removeSubject(ref);

    const updatedWorkspaceDoc = await workspace.save();
    updateWorkspace(updatedWorkspaceDoc)
    return true;
  }, [workspace, updateWorkspace]);

  const saveName = async (pageDoc, name) => {
    const page = pageDoc.getSubject(pageDoc.asRef())
    page.setLiteral(schema.name, name)
    const updatedPageDoc = await pageDoc.save([page]);
    const summary = workspace.getSubject(pageDoc.asRef());
    summary.setLiteral(schema.name, name)
    updateWorkspace(await workspace.save([summary]))
    return updatedPageDoc;
  }

  return (
    <Provider {...props} value={{workspace, pages, addPage, saveName, updatePage, deletePage}} />
  )
}

export default WorkspaceContext;

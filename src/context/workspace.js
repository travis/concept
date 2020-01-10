import React, {useEffect, useState, createContext, useContext, useCallback} from 'react';
import {fetchDocument, createDocument} from 'tripledoc';
import {space, rdf, solid, schema} from 'rdf-namespaces';

import AuthContext from '../context/auth'

const WorkspaceContext = createContext({});

const {Provider} = WorkspaceContext;

async function initialisePagesList(profile, typeIndex) {
  // Get the root URL of the user's Pod:
  const storage = profile.getRef(space.storage);

  // Decide at what URL within the user's Pod the new Document should be stored:
  const workspaceRef = storage + 'public/concept/workspace.ttl';
  // Create the new Document:
  const workspace = createDocument(workspaceRef);
  await workspace.save();

  // Store a reference to that Document in the public Type Index for `schema:DigitalDocument`:
  const typeRegistration = typeIndex.addSubject();
  typeRegistration.addRef(rdf.type, solid.TypeRegistration)
  typeRegistration.addRef(solid.instance, workspace.asRef())
  typeRegistration.addRef(solid.forClass, schema.DigitalDocument)
  await typeIndex.save([ typeRegistration ]);

  // And finally, return our newly created (currently empty) pages Document:
  return workspace;
}

async function getPagesList(profile) {
  /* 1. Check if a Document tracking our pages already exists. */
  const publicTypeIndexRef = profile.getRef(solid.publicTypeIndex);
  const publicTypeIndex = await fetchDocument(publicTypeIndexRef);
  const workspaceEntry = publicTypeIndex.findSubject(solid.forClass, schema.DigitalDocument);

  /* 2. If it doesn't exist, create it. */
  if (workspaceEntry === null) {
    // We will define this function later:
    return initialisePagesList(profile, publicTypeIndex);
  }

  /* 3. If it does exist, fetch that Document. */
  const workspaceRef = workspaceEntry.getRef(solid.instance);
  return await fetchDocument(workspaceRef);
}

export const WorkspaceProvider = (props) => {
  const [workspace, setWorkspace] = useState(null)
  const [pages, setPages] = useState(null)
  const {currentUser} = useContext(AuthContext)

  const updateWorkspace = useCallback(function updateWorkspace(newWorkspace) {
    setWorkspace(newWorkspace)
    setPages(newWorkspace.getSubjectsOfType(schema.DigitalDocument))
  }, [])

  useEffect(() => {
    const loadPagesList = async () => {
      const workspaceDoc = await getPagesList(currentUser)
      updateWorkspace(workspaceDoc)
    }
    if (currentUser) loadPagesList(currentUser)
  }, [currentUser, updateWorkspace])

  const addPage = useCallback(async function addPage(name="Untitled") {
    // Initialise the new Subject:
    const newPage = workspace.addSubject();

    // Indicate that the Subject is a schema:DigitalDocument:
    newPage.addRef(rdf.type, schema.DigitalDocument);

    // Set the Subject's `schema:headline` to the actual page contents:
    newPage.addLiteral(schema.name, name);

    // Store the date the page was created (i.e. now):
    newPage.addLiteral(schema.dateCreated, new Date(Date.now()))

    const updatedWorkspaceDoc = await workspace.save([newPage]);
    updateWorkspace(updatedWorkspaceDoc)
    return newPage;
  }, [workspace, updateWorkspace]);

  const deletePage = useCallback(async function deletePage(ref) {
    // Initialise the new Subject:
    workspace.removeSubject(ref);

    const updatedWorkspaceDoc = await workspace.save();
    updateWorkspace(updatedWorkspaceDoc)
    return true;
  }, [workspace, updateWorkspace]);

  return (
    <Provider {...props} value={{workspace, pages, addPage, deletePage}} />
  )
}

export default WorkspaceContext;

import React, { useContext } from 'react'
import WorkspaceContext from "../context/workspace";
import Pages from "./Pages"

export default function Workspace(){
  const {workspace, addPage} = useContext(WorkspaceContext);
  return (
    <Pages workspace={workspace} addPage={addPage}/>
  )
}

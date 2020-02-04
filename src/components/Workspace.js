import React, {useContext} from 'react'
import WorkspaceContext from "../context/workspace";
import Pages from "./Pages"
import {LiveUpdate} from "@solid/react";

export default function Workspace(){
  const {workspace, addPage} = useContext(WorkspaceContext);
  return (
    <LiveUpdate>
      <Pages workspace={workspace} addPage={addPage}/>
    </LiveUpdate>
  )
}

import React, { useContext } from 'react'
import { LiveUpdate } from "@solid/react";
import {Switch, Route} from 'react-router-dom'

import WorkspaceContext, {WorkspaceProvider} from "../context/workspace";

import PageDrawer from './PageDrawer';
import Pages from "./Pages"
import PublicProfile, {EncodedWebIdPublicProfile} from './PublicProfile';



function WorkspaceContent(){
  const {workspace, addPage} = useContext(WorkspaceContext);
  return (
    <>
      {workspace && (
        <LiveUpdate subscribe={[workspace.uri]}>
          <PageDrawer workspace={workspace} />
        </LiveUpdate>
      )}
      <Switch>
        <Route path="/page/:selectedPage" render={() => <Pages workspace={workspace} addPage={addPage}/>}/>
        <Route path="/for/:handle" component={PublicProfile}/>
        <Route path="/webid/:encodedWebId" component={EncodedWebIdPublicProfile}/>
      </Switch>
    </>
  )
}

export default function Workspace(){
  return (
    <WorkspaceProvider>
      <WorkspaceContent/>
    </WorkspaceProvider>
  )
}

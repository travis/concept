import React, { useContext } from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';

import { LiveUpdate } from "@solid/react";
import {Switch, Route} from 'react-router-dom'

import WorkspaceContext, {WorkspaceProvider} from "../context/workspace";

import PageDrawer from './PageDrawer';
import Pages from "./Pages"
import Home from "./Home"
import PublicProfile, {EncodedWebIdPublicProfile} from './PublicProfile';
import { drawerWidth } from '../constants'

const useStyles = makeStyles(theme => ({
  content: {
    marginLeft: drawerWidth,
    height: "100%",
    position: "relative"
  },
}));


function WorkspaceContent(){
  const classes = useStyles()
  const {workspace} = useContext(WorkspaceContext);
  return (
    <>
      {workspace && (
        <LiveUpdate subscribe={[workspace.uri]}>
          <PageDrawer workspace={workspace} />
        </LiveUpdate>
      )}
      <Box className={classes.content}>
        <Switch>
          <Route path="/page/:selectedPage">
            <Pages/>
          </Route>
          <Route path="/for/:handle">
            <PublicProfile/>
          </Route>
          <Route path="/webid/:encodedWebId">
            <EncodedWebIdPublicProfile/>
          </Route>
          <Route path="/">
            <Home/>
          </Route>
        </Switch>
      </Box>
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

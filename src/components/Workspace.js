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


const WorkspaceRoute = ({children, ...props}) => {
  const {workspace} = useContext(WorkspaceContext);
  return (
    <Route {...props}>
      {workspace && (
        <LiveUpdate subscribe={[workspace.uri]}>
          <PageDrawer workspace={workspace} />
        </LiveUpdate>
      )}
      {children}
    </Route>
  )
}


function WorkspaceContent(){
  const classes = useStyles()
  return (
    <>
      <Box className={classes.content}>
        <Switch>
          <WorkspaceRoute path="/page/:selectedPage">
            <Pages/>
          </WorkspaceRoute>
          <WorkspaceRoute path="/for/:handle">
            <PublicProfile/>
          </WorkspaceRoute>
          <WorkspaceRoute path="/webid/:encodedWebId">
            <EncodedWebIdPublicProfile/>
          </WorkspaceRoute>
          <WorkspaceRoute path="/">
            <Home/>
          </WorkspaceRoute>
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

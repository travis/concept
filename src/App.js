import React from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import CssBaseline from '@material-ui/core/CssBaseline';
import { DndProvider } from 'react-dnd'
import DndBackend from 'react-dnd-html5-backend'
import {useLoggedIn} from '@solid/react';

import './App.css';
import {AuthProvider} from './context/auth'

import Workspace from './components/Workspace';
import Console from './components/Console';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';
import WhatPage from './components/WhatPage';

function App() {
  const loggedIn = useLoggedIn()

  return (
    <div className="App">
      <Switch>
        <Route path="/what" component={WhatPage}/>
        {loggedIn ? (
          <Switch>
            <Route path="/1337" component={Console}/>
            <Route path="/" component={Workspace}/>
          </Switch>
        ) : (
          <Switch>
            <Route path="/signup" component={SignupPage}/>
            <Route path="/" component={LandingPage}/>
          </Switch>
        )}
      </Switch>

    </div>
  )
}


function AppContainer() {
  return (
    <>
      <CssBaseline/>
        <DndProvider backend={DndBackend}>
          <Router>
            <AuthProvider>
              <App/>
            </AuthProvider>
          </Router>
        </DndProvider>
    </>
  );
}

export default AppContainer;

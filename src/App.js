import React from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import CssBaseline from '@material-ui/core/CssBaseline';
import { DndProvider } from 'react-dnd'
import DndBackend from 'react-dnd-html5-backend'

import './App.css';
import {AuthProvider} from './context/auth'
import {WorkspaceProvider} from './context/workspace'

import Workspace from './components/Workspace';
import Console from './components/Console';

function App() {
  return (
    <>
      <CssBaseline/>
      <AuthProvider>
        <DndProvider backend={DndBackend}>
          <Router>
            <div className="App">
              <WorkspaceProvider>
                <Switch>
                  <Route path="/1337" component={Console}/>
                  <Route path="/" component={Workspace}/>
                </Switch>
              </WorkspaceProvider>
            </div>
          </Router>
        </DndProvider>
      </AuthProvider>
    </>
  );
}

export default App;

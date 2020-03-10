import React from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import CssBaseline from '@material-ui/core/CssBaseline';

import './App.css';
import {AuthProvider} from './context/auth'
import {WorkspaceProvider} from './context/workspace'

import Workspace from './components/Workspace';
import Backups from './components/Backups';

function App() {
  return (
    <>
      <CssBaseline/>
      <AuthProvider>
        <Router>
          <div className="App">
            <WorkspaceProvider>
              <Switch>
                <Route exact path="/" component={Workspace}/>
                <Route path="/page/:selectedPage" component={Workspace}/>
                <Route path="/page/:selectedPage/backups" component={Backups}/>
              </Switch>
            </WorkspaceProvider>
          </div>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;

import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';

import './App.css';
import {AuthProvider} from './context/auth'
import {WorkspaceProvider} from './context/workspace'

import Workspace from './components/Workspace';

function App() {
  return (
    <>
      <CssBaseline/>
      <AuthProvider>
        <WorkspaceProvider>
          <div className="App">
            <Workspace/>
          </div>
        </WorkspaceProvider>
      </AuthProvider>
    </>
  );
}

export default App;

import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';

import './App.css';
import {AuthProvider} from './context/auth'
import {WorkspaceProvider} from './context/workspace'

import Pages from './components/Pages';

function App() {
  return (
    <>
      <CssBaseline/>
      <AuthProvider>
        <WorkspaceProvider>
          <div className="App">
            <Pages/>
          </div>
        </WorkspaceProvider>
      </AuthProvider>
    </>
  );
}

export default App;

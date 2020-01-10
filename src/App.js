import React from 'react';
import logo from './logo.svg';
import './App.css';
import {AuthProvider} from './context/auth'
import {WorkspaceProvider} from './context/workspace'

import LogInLogOutButton from './components/LogInLogOutButton'
import Pages from './components/Pages'

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <div className="App">
          <header className="App-header">
            <LogInLogOutButton/>
          </header>
          <Pages/>
        </div>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;

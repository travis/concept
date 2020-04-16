import React, { createContext, useContext, useState } from 'react';

export interface Preferences {
  devMode: boolean
  setDevMode: (v: boolean) => void
}

var devMode = false
const setDevMode = (m: boolean) => { }

const PreferencesContext = createContext<Preferences>({ devMode, setDevMode })

const { Provider } = PreferencesContext

export const usePreferences = () => useContext<Preferences>(PreferencesContext)

export const PreferencesProvider = (props: any) => {
  const [devMode, setDevMode] = useState(false)
  return (
    <Provider {...props} value={{ devMode, setDevMode }} />
  )
}

export default PreferencesContext;

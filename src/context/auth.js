import React, {useEffect, useState, createContext} from 'react';
import auth from 'solid-auth-client';
import { fetchDocument } from 'tripledoc';

const AuthContext = createContext({})

const {Provider} = AuthContext;

export const AuthProvider = (props) => {
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [session, setSession] = useState(null)
  async function establishSession() {
    const sesh = await auth.currentSession()
    setSession(sesh)
    setSessionLoaded(true)
  }
  useEffect(() => {
    establishSession()
  }, [])

  async function logIn() {
    const session = await auth.popupLogin({popupUri: "/popup.html"})
    setSession(session)
  }
  async function logOut() {
    await auth.logout()
    setSession(null)
  }

  const [currentUserLoaded, setCurrentUserLoaded] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (sessionLoaded) {
        if (session) {
          const webIdDoc = await fetchDocument(session.webId)
          setCurrentUser(webIdDoc.getSubject(session.webId))
        } else {
          setCurrentUser(null)
        }
        setCurrentUserLoaded(true)
      }
    }
    loadCurrentUser()
  }, [sessionLoaded, session])

  return (
    <Provider {...props} value={{
      session, sessionLoaded,
      currentUser, currentUserLoaded,
      logIn, logOut}} />
  )
}

export default AuthContext

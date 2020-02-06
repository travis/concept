import React, {useEffect, useState, createContext} from 'react';
import auth from 'solid-auth-client';

const AuthContext = createContext({})

const {Provider} = AuthContext;

export const AuthProvider = (props) => {
  async function logIn() {
    const session = await auth.popupLogin({popupUri: "/popup.html"})
  }
  async function logOut() {
    await auth.logout()
  }

  return (
    <Provider {...props} value={{logIn, logOut}} />
  )
}

export default AuthContext

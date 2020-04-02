import React, {useContext} from 'react';
import Button from '@material-ui/core/Button';

import AuthContext from "../context/auth"
import {useLoggedIn} from '@solid/react';

export function LogInButton(props) {
  const {logIn} = useContext(AuthContext)
  return (
    <Button onClick={() => logIn()} {...props}/>
  )
}

export default function LogInLogOutButton(props) {
  const loggedIn = useLoggedIn();
  const {logIn, logOut} = useContext(AuthContext)
  return (
    <Button onClick={loggedIn ? logOut : logIn} {...props}>
      {loggedIn ? "Log Out" : "Log In"}
    </Button>
  )
}

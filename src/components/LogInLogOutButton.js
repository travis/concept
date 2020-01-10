import React, {useContext} from 'react';
import Button from '@material-ui/core/Button';

import AuthContext from "../context/auth"


export default function LogInLogOutButton(props) {
  const {currentUserLoaded, currentUser, logIn, logOut} = useContext(AuthContext)
  return currentUserLoaded ? (
    <Button onClick={currentUser ? logOut : logIn} {...props}>
      {currentUser ? "Log Out" : "Log In"}
    </Button>
  ) : (
    ""
  )
}

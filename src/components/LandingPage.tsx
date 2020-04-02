import React from 'react'

import { Link } from 'react-router-dom';

import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';

import { LogInButton } from './LogInLogOutButton'
import { AppTitleGridRow } from './AppTitle'
import SocialIcons from './SocialIcons'
import logo from '../logo.svg'


const useStyles = makeStyles(theme => ({
  name: {
    marginTop: theme.spacing(3),
    fontFamily: "'Special Elite', cursive"
  },
  logo: {
    width: theme.spacing(18)
  },
  actionButton: {
    fontSize: "1.6rem"
  },
  social: {
    marginTop: theme.spacing(6)
  },
  socialIcon: {
    color: "inherit"
  }
}))

function LandingPage() {
  const classes = useStyles({})
  return (
    <>
      <AppTitleGridRow />
      <Grid container>
        <Grid item xs={12}>
          <img src={logo} className={classes.logo} alt="Concept Logo" />
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={3}>
        </Grid>
        <Grid item xs={3}>
          <Button className={classes.actionButton}
            component={Link} to="/signup">
            sign up
            </Button>
        </Grid>
        <Grid item xs={3}>
          <LogInButton className={classes.actionButton}>log in</LogInButton>
        </Grid>
        <Grid item xs={3}>
        </Grid>
      </Grid >
      <Grid container>
        <Grid item xs={12}>
          <Button component={Link} to="/what">what is this?</Button>
        </Grid>
      </Grid>
      <SocialIcons />
    </>
  )
}

export default LandingPage

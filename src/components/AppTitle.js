import React from 'react';

import {Link} from 'react-router-dom';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { titleFont } from '../utils/fonts'

const useStyles = makeStyles(theme => ({
  name: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
    fontFamily: titleFont,
    textDecoration: "none",
    color: "inherit"
  },
  motto: {
    marginBottom: theme.spacing(1),
  }
}))

export function AppTitleGridRow(){
  const classes = useStyles({})
  return (
    <Grid container>
      <Grid item xs={12}>
          <Typography variant="h2">
            <Link to="/" className={classes.name}>
              Concept
            </Link>
          </Typography>
      </Grid>
    </Grid>
  )
}

export function MottoGridRow(){
  const classes = useStyles({})
  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="subtitle1" className={classes.motto}>
          Concept is a collaborative workspace for organizing the world.
        </Typography>
      </Grid>
    </Grid>
  )
}

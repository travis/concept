import React from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';

import { titleFont } from '../utils/fonts'

const useStyles = makeStyles(theme => ({
  question: {
    fontFamily: titleFont,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2)
  },
  answer: {
    ...theme.typography.body2,
    "& p": {
      marginBottom: theme.spacing(2)
    }
  }
}))

export const Question = ({children}) => {
  const classes = useStyles()
  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="h4" className={classes.question}>
          {children}
        </Typography>
      </Grid>
    </Grid>
  )
}

export const Answer = ({children}) => {
  const classes = useStyles()
  return (
    <Grid container>
      <Grid item xs={2}>
      </Grid>
      <Grid item xs={8} className={classes.answer}>
        {children}
      </Grid>
      <Grid item xs={2}>
      </Grid>
    </Grid>
  )
}

export const A = (props) => <Link target="_blank" {...props}/>

import React from 'react';

import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Twitter from '@material-ui/icons/Twitter';
import GitHub from '@material-ui/icons/GitHub';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  social: {
    marginTop: theme.spacing(6)
  },
  socialIcon: {
    color: "inherit"
  }
}))

export default function SocialIcons(){
  const classes = useStyles()
  return (
    <Grid container className={classes.social}>
      <Grid item xs={5}>
      </Grid>
      <Grid item xs={1}>
        <Link href="https://twitter.com/useconceptart" target="_blank"
              className={classes.socialIcon}>
          <Twitter />
        </Link>
      </Grid>
      <Grid item xs={1}>
        <Link href="https://github.com/travis/concept" target="_blank"
              className={classes.socialIcon}>
          <GitHub />
        </Link>
      </Grid>
      <Grid item xs={5}>
      </Grid>
    </Grid>
  )
}

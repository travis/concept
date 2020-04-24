import React, { FunctionComponent } from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';

import ReportErrorButton from './ReportErrorButton'
import SocialIcons from './SocialIcons'

const useStyles = makeStyles(theme => ({
  page: {
    marginTop: theme.spacing(9),
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3)
  },
  message: {
    fontFamily: "'Special Elite', cursive",
    marginBottom: theme.spacing(6),
  }
}))

type UnrecoverableErrorPageProps = {
  eventId: string | undefined
}

const UnrecoverableErrorPage: FunctionComponent<UnrecoverableErrorPageProps> = ({ eventId }) => {
  const classes = useStyles({})
  return (
    <Box textAlign="center" className={classes.page}>
      <Grid container>
        <Grid item xs={12} className={classes.message}>
          Oh dear. We've encountered a possible infinite loop and couldn't recover. Reloading may solve the problem.
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={12}>
          <ReportErrorButton eventId={eventId} />
        </Grid>
      </Grid>
      <SocialIcons />
    </Box>
  )
}

export default UnrecoverableErrorPage

import React from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';

import { LiveUpdate } from "@solid/react";
import { useCurrentPageUri } from '../hooks/pages';
import Page from './Page'
import Loader from './Loader'

const usePagesStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    position: "relative",
    height: "100%"
  },
}));

export default function CurrentPage() {
  const classes = usePagesStyles()
  const currentPageUri = useCurrentPageUri()
  return (
    <Box className={classes.content}>
      {
        currentPageUri ? (
          <LiveUpdate subscribe={currentPageUri}>
            <Page pageUri={currentPageUri} />
          </LiveUpdate >
        ) : (
            <Loader />
          )
      }
    </Box>
  )
}

import React from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';

import { LiveUpdate } from "@solid/react";
import { useCurrentPage } from '../hooks/pages';
import Home from './Home'
import Page from './Page'
import Loader from './Loader'
import { Workspace } from "../utils/model"

const usePagesStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    position: "relative",
    height: "100%"
  },
}));

function CurrentPage() {
  const [currentPage, loading] = useCurrentPage()
  return loading ? (
    <Loader />
  ) : (
      currentPage ? (
        <LiveUpdate subscribe={currentPage.uri}>
          <Page page={currentPage} />
        </LiveUpdate >
      ) : (
          <Home />
        )
    )
}

type PagesProps = {
  workspace: Workspace
}

export default function Pages({ workspace }: PagesProps) {
  const classes = usePagesStyles()
  return (
    <Box className={classes.content}>
      <CurrentPage />
    </Box>
  )
}

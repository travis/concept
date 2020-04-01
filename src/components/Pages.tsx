import React from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';

import { LiveUpdate } from "@solid/react";
import { useCurrentPage } from '../hooks/pages';
import Page from './Page'
import { Workspace } from "../utils/model"

const usePagesStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    marginLeft: 240,
    position: "relative",
    height: "100%"
  },
}));

function CurrentPage() {
  const [currentPage] = useCurrentPage()
  return currentPage ? (
    <LiveUpdate subscribe={currentPage.uri}>
      <Page page={currentPage} />
    </LiveUpdate>
  ) : (
      <p>Welcome to Concept! Add or select a page on the left to get started.</p>
    )
}

type PagesProps = {
  workspace: Workspace
}

export default function Pages({ workspace }: PagesProps) {
  const classes = usePagesStyles()
  return (
    <Box className={classes.content}>
      {workspace && <CurrentPage />}
    </Box>
  )
}

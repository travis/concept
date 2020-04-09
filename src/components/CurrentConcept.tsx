import React from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';

import { LiveUpdate } from "@solid/react";
import { useCurrentConceptUri, useCurrentConcept } from '../hooks/concepts';
import Page from './Page'
import Loader from './Loader'

const useStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    position: "relative",
    height: "100%"
  },
}));

function ConceptInsideLiveUpdate() {
  const [currentConcept] = useCurrentConcept()
  return currentConcept ? (<Page document={currentConcept} />) : (<Loader />)

}

export default function CurrentConcept() {
  const classes = useStyles()
  const currentConceptUri = useCurrentConceptUri()
  return (
    <Box className={classes.content}>
      {
        currentConceptUri ? (
          <LiveUpdate subscribe={currentConceptUri}>
            <ConceptInsideLiveUpdate />
          </LiveUpdate >
        ) : (
            <Loader />
          )
      }
    </Box>
  )
}

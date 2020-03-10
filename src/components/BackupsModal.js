import React, {useState, useCallback} from 'react';

import {useWebId} from '@solid/react';
import data from '@solid/query-ldflex';
import {namedNode} from '@rdfjs/data-model';

import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import Close from '@material-ui/icons/Close';
import Add from '@material-ui/icons/Add';

import { schema, foaf, acl } from 'rdf-namespaces';

import { useLDflex, useLDflexList } from '../hooks/ldflex';
import Backups from './Backups';

const useStyles = makeStyles(theme => ({
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

export default function BackupsModal({page, open, onClose}) {
  const [name] = useLDflex(`[${page}][${schema.name}]`);
  const classes = useStyles();
  return (
    <Modal
      aria-labelledby="backups-modal-title"
      aria-describedby="backups-modal-description"
      open={open}
      onClose={onClose}
    >
      <div className={classes.paper}>

        <h2 id="backups-modal-title">Backups</h2>
        <p id="bacups-modal-description">
          Backups of {name && name.toString()}
        </p>
        <Backups page={page}/>
      </div>
    </Modal>
  )
}

import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import { schema } from 'rdf-namespaces';

import { useLDflexValue } from '../hooks/ldflex';
import Backups from './Backups';

const useStyles = makeStyles(theme => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  }
}));

export default function BackupsDialog({page, open, handleClose}) {
  const name = useLDflexValue(`[${page.uri}][${schema.name}]`);
  const classes = useStyles();
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        Backups
        <IconButton aria-label="close" className={classes.closeButton} onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Backups of {name && name.toString()}
        </DialogContentText>
        <Backups page={page} handleClose={handleClose}/>
      </DialogContent>
    </Dialog>
  )
}

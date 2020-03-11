import React, {useState, useCallback} from 'react';

import data from '@solid/query-ldflex';

import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import { ldp, schema, dct } from 'rdf-namespaces';

import { Slate } from 'slate-react';

import { useLDflexList, useLDflexValue } from '../hooks/ldflex';
import { backupFolderForPage } from '../utils/backups'
import { createBackup } from '../hooks/backup'
import concept from '../ontology'
import Editable, {useEditor} from "./Editable";
import Loader from "./Loader";

const useStyles = makeStyles(theme => ({
  editor: {
    textAlign: "left",
    padding: theme.spacing(2),
    background: "white",
    position: "relative",
    height: "600em",
    minWidth: theme.spacing(100)
  },
  table: {
    mindWidth: 650
  },
  restoreLoader: {
    textAlign: "right",
    paddingRight: theme.spacing(4)
  },
  previewCloseButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
}));

function RestoreDialog({original, date, restore, handleClose, open}){
  const originalName = useLDflexValue(`[${original}][${schema.name}]`)
  const [restoring, setRestoring] = useState(false)
  const handleConfirm = useCallback(async () => {
    setRestoring(true)
    await restore()
  }, [restore])
  const classes = useStyles()
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="confirm-restore-dialog-title"
      aria-describedby="confirm-restore-dialog-description"
    >
      <DialogTitle id="confirm-restore-dialog-title">
        Restore {date.toLocaleString()} version of {originalName && originalName.value}?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-restore-dialog-description">
          We'll create a backup of the current version first.
        </DialogContentText>
      </DialogContent>
      {restoring ? (
        <Loader className={classes.restoreLoader}/>
      ) : (
        <DialogActions>
          <Button onClick={handleConfirm} color="primary">
            Yes!
          </Button>
          <Button onClick={handleClose} color="primary" autoFocus>
            No nevermind
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

function PreviewName({original}){
  const name = useLDflexValue(`[${original}][${schema.name}]`)
  return <>{name && name.value}</>
}

function PreviewDialog({backup, date, open=true, handleClose}){
  const [showRestore, setShowRestore] = useState(false)
  const original = useLDflexValue(`[${backup}][${concept.backupOf}]`)
  const backupText = useLDflexValue(`[${backup}][${schema.text}]`)
  const editor = useEditor()
  const classes = useStyles();
  const restore = useCallback(async () => {
    const currentText = data[original][schema.text]
    await createBackup(original.value, "beforeLastRestore.ttl", (await currentText).value)
    await currentText.set(backupText.value)
    setShowRestore(false)
    handleClose({closeAll: true})
  }, [original, backupText, handleClose])
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        {original && <PreviewName original={original}/>}
        <IconButton aria-label="close" className={classes.previewCloseButton} onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {backupText && (
          <Slate editor={editor} value={JSON.parse(backupText.value)}>
            <Paper className={classes.editor}>
              <Editable readOnly editor={editor}/>
            </Paper>
          </Slate>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={() => setShowRestore(true)}>
          Restore
        </Button>
      </DialogActions>
      {showRestore && <RestoreDialog original={original} date={date}
                                     restore={restore} handleClose={() => setShowRestore(false)}
                                     open={showRestore} />}
    </Dialog>
  )
}

function Backup({backupFolder, backup, handleClose}){
  const [showPreview, setShowPreview] = useState(false)
  const meta = `${backupFolder}.meta`
  const backupDateNode = useLDflexValue(`from([${meta}])[${backup}][${dct.modified}]`)
  const backupDate = backupDateNode && new Date(backupDateNode.value)
  const handleClosePreview = useCallback(({closeAll}) => {
    setShowPreview(false)
    if (closeAll){
      handleClose({closeAll})
    }
  }, [handleClose])
  return (
    <TableRow>
      <TableCell>{backupDate && backupDate.toLocaleString()}</TableCell>
      <TableCell>{backup && backup.value.split("/").slice(-1)[0]}</TableCell>
      <TableCell>
        <Button onClick={() => setShowPreview(true)}>Show Preview</Button>
        {showPreview && <PreviewDialog backup={backup} date={backupDate}
                                       handleClose={handleClosePreview}/>}
      </TableCell>
    </TableRow>
  )
}

export default function Backups({page, handleClose}){
  const backupFolder = backupFolderForPage(page)
  const backups = useLDflexList(`[${backupFolder}][${ldp.contains}]`)
  const classes = useStyles()
  return (
    <TableContainer component={Paper}>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Name</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            backups && backups.map(backup => (
              <Backup key={backup} backupFolder={backupFolder} backup={backup} handleClose={handleClose}>
                {backup.value}
              </Backup>
            ))
          }
        </TableBody>
      </Table>
    </TableContainer>
  )
}

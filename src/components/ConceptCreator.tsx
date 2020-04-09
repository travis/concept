import React, { useEffect, useContext, useState, FunctionComponent } from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog, { DialogProps } from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';

import { useDebounce } from 'use-debounce';

import Loader from './Loader';
import WorkspaceContext from "../context/workspace";
import { resourceExists } from '../utils/ldflex-helper'
import { conceptUri } from '../utils/urls'

const useStyles = makeStyles(theme => ({
  nameTextField: {
    width: "100%",
    marginTop: theme.spacing(2),
  }
}))

type ConceptCreatorProps = DialogProps & {
  close: () => void
}

const ConceptCreator: FunctionComponent<ConceptCreatorProps> = ({ close, ...props }) => {
  const classes = useStyles()
  const { workspace, addConcept } = useContext(WorkspaceContext);
  const [saving, setSaving] = useState(false)
  const [nameCheckNeeded, setNameCheckNeeded] = useState(false)
  const [conceptExists, setConceptExists] = useState<boolean | undefined>()
  const [error, setError] = useState(null)
  const [name, setName] = useState("")
  const [debouncedName] = useDebounce(name, 500);

  const save = async () => {
    setError(null)
    setSaving(true)
    addConcept && await addConcept({ name: debouncedName })
    setSaving(false)
    close()
  }
  useEffect(() => {
    const checkName = async () => {
      if (workspace && (debouncedName !== "")) {
        setConceptExists(await resourceExists(conceptUri(workspace.conceptContainerUri, debouncedName)))
      }
    }
    if (nameCheckNeeded) {
      setNameCheckNeeded(false)
      checkName()
    }
  }, [debouncedName, nameCheckNeeded, workspace])
  useEffect(() => setNameCheckNeeded(true), [debouncedName])
  return (
    <Dialog {...props} onKeyDown={e => e.stopPropagation()}>
      <DialogContent>
        {error && (
          <DialogContentText>
            {error}
          </DialogContentText>
        )}
        {(conceptExists === true) && (
          <DialogContentText>
            {debouncedName} already exists
          </DialogContentText>
        )}
        <TextField value={name || ""} label="concept name" variant="filled" size="small"
          autoFocus
          className={classes.nameTextField}
          onChange={(e) => setName(e.target.value)} />
      </DialogContent>
      <DialogActions>
        {saving ? (
          <Loader />
        ) : (
            <>
              <Button onClick={save} disabled={((debouncedName === "") || (conceptExists))}>
                save
               </Button>
              <Button onClick={e => close && close()}>
                cancel
               </Button>
            </>
          )}
      </DialogActions>
    </Dialog >
  )
}

export default ConceptCreator

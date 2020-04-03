import React, {useState} from 'react'

import auth from 'solid-auth-client'

import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';

import Loader from './Loader';

const useStyles = makeStyles(theme => ({
  urlTextField: {
    width: "100%",
    marginTop: theme.spacing(2),
  }
}))

export default function EmbedPicker({onSave, onClose, ...props}){
  const classes = useStyles()
  const [saving, setSaving] = useState()
  const [error, setError] = useState()
  const [url, setUrl] = useState()
  const save = async () => {
    setError(null)
    setSaving(true)
    try {
      const response = await auth.fetch(url, {method: 'HEAD'})
      if (response.ok){
        const type = response.headers.get("content-type").split(";")[0]
        await onSave(url, type)
      } else {
        setError(`Error loading ${url}`)
      }
    } catch (e){
      if (e.name === "TypeError"){
        setError(`Could not load ${url}: the resource probably doesn't exist or does not have the correct CORS configuration.`)
      } else {
        setError(`Error loading ${url}: ${e.message}`)
      }
    }
    setSaving(false)
  }
  return (
    <Dialog {...props} onKeyDown={e => e.stopPropagation()}>
      <DialogContent>
        {error && (
          <DialogContentText>
            {error}
          </DialogContentText>
        )}
        <TextField value={url || ""} label="embed URL" variant="filled" size="small"
                   autoFocus
                   className={classes.urlTextField}
                   onChange={(e) => setUrl(e.target.value)}/>
      </DialogContent>
      <DialogActions>
        {saving ? (
          <Loader/>
        ) : (
          <>
            <Button onClick={save}>
              save
            </Button>
            <Button onClick={onClose}>
              cancel
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

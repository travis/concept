import React, { useEffect, useRef, useState } from 'react';
import { Transforms } from 'slate';
import { useEditor } from 'slate-react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import uuid from 'uuid/v1';
import auth from 'solid-auth-client';

import { insertionPoint, insertImage } from '../utils/editor';
import Loader from './Loader';

const useStyles = makeStyles(theme => ({
  uploader: {
  },
  cropper: {
    maxHeight: theme.spacing(50)
  },
  previewImage: {
    display: "block",
    height: theme.spacing(30),
    width: "auto",
    marginLeft: "auto",
    marginRight: "auto",
  },
  altTextField: {
    width: "100%",
    marginTop: theme.spacing(2),
  }
}))

const ImageEditingModal = ({src, onSave, onClose, ...props}) => {
  const [saving, setSaving] = useState()
  const classes = useStyles()
  const cropper = useRef()
  const save = async () => {
    setSaving(true)
    await onSave(cropper.current.getCroppedCanvas())
    setSaving(false)
  }
  return (
    <Dialog onClose={onClose} {...props}>
      <DialogContent>
        <Cropper
          ref={cropper}
          className={classes.cropper}
          src={src}
          crossOrigin="use-credentials"
        />
        <Button onClick={() => {
          cropper.current.rotate(90)
        }}>
          rotate
        </Button>
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

const typesToExts = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp"
}

const extForFile = file => {
  const extFromType = typesToExts[file.type]
  if (extFromType) {
    return extFromType
  } else {
    return file.name.split(".").slice(-1)[0]
  }
}

const nameForFile = file => `${uuid()}.${extForFile(file)}`

const uploadFromCanvas = (canvas, uri, type) => new Promise((resolve, reject) => {
  canvas.toBlob(async (blob) => {
    const response = await auth.fetch(uri, {
      method: 'PUT',
      force: true,
      headers: {
        'content-type': type,
        credentials: 'include'
      },
      body: blob
    });
    if (response.ok){
      resolve(response)
    } else {
      reject(response)
      console.log("image upload failed: ", response)
    }
  }, type, 1)

})

const uploadFromFile = (file, uri) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = async f => {
    const response = await auth.fetch(uri, {
      method: 'PUT',
      force: true,
      headers: {
        'content-type': file.type,
        credentials: 'include'
      },
      body: f.target.result
    });
    if (response.ok){
      resolve(response)
    } else {
      reject(response)
    }
  }
  reader.readAsArrayBuffer(file);
})

const uriForOriginal = (editedUri) => {
  const parts = editedUri.split(".")
  return [...parts.slice(0, -1), "original", ...parts.slice(-1)].join(".")
}

export function ImageEditor({element, onClose, onSave, ...props}) {

  const {url, originalUrl, mime} = element
  return (
    <ImageEditingModal src={originalUrl || url}
                       onClose={onClose}
                       onSave={async (canvas) => {
                         await uploadFromCanvas(canvas, url, mime)
                         onSave(url)
                       }} {...props}/>
  )
}

export default ({element, onClose, uploadDirectory, ...props}) => {
  const classes = useStyles()
  const inputRef = useRef()
  const editor = useEditor()
  const [file, setFile] = useState()
  const [originalSrc, setOriginalSrc] = useState()
  const [previewSrc, setPreviewSrc] = useState()
  const [altText, setAltText] = useState("")
  const [croppedCanvas, setCroppedCanvas] = useState()
  const [editing, setEditing] = useState(false)

  const insert = async () => {
    const editedUri = `${uploadDirectory}${nameForFile(file)}`
    const originalUri = uriForOriginal(editedUri)
    uploadFromFile(file, originalUri)
    await uploadFromCanvas(croppedCanvas, editedUri, file.type)
    const insertAt = insertionPoint(editor, element)
    insertImage(editor, {url: editedUri, originalUrl: originalUri, alt: altText, mime: file.type}, insertAt);
    Transforms.select(editor, insertAt)
    onClose()
  }

  useEffect(() => {
    let newSrc;
    if (file){
      newSrc = URL.createObjectURL(file)
      setOriginalSrc(newSrc)
      setPreviewSrc(newSrc)
      setEditing(true)
    }
    return () => {
      if (newSrc){
        URL.revokeObjectURL(newSrc)
      }
    }
  }, [file])

  const onFileChanged = event => {
    if (event.target.files) {
      const file = event.target.files[0]
      setFile(file)
    }
  }

  return (
    <Dialog className={classes.uploader} onClose={onClose} {...props}>
      <DialogContent>
        {previewSrc && (
          <>
            <img src={previewSrc} className={classes.previewImage} alt={altText}/>
            <TextField value={altText} label="alt text" variant="filled" size="small"
                       className={classes.altTextField}
                       onChange={(e) => setAltText(e.target.value)}/>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => inputRef.current.click()}>
          pick a file
        </Button>
        {croppedCanvas &&
         <>
           <Button onClick={() => setEditing(true)}>
             edit
           </Button>
           <Button onClick={insert}>
             insert
           </Button>
         </>
        }
        <Button onClick={() => onClose()}>
          cancel
        </Button>
      </DialogActions>
      <input
        ref={inputRef}
        accept="image/*"
        style={{ display: 'none' }}
        type="file"
        onChange={onFileChanged}
      />
      <ImageEditingModal open={editing} src={originalSrc}
                         onClose={onClose}
                         onSave={async (canvas) => {
                           setPreviewSrc(canvas.toDataURL(file.type))
                           setCroppedCanvas(canvas)
                           setEditing(false)
                         }}/>
    </Dialog>
  )
}

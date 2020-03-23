import React, { useEffect, useRef, useState } from 'react';
import { Transforms } from 'slate';
import { useEditor } from 'slate-react';
import { insertionPoint, insertImage } from '../utils/editor';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import { makeStyles } from '@material-ui/core/styles';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import uuid from 'uuid/v1';
import auth from 'solid-auth-client';

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
  }
}))

const ImageEditingModal = ({src, onSave, onCancel, ...props}) => {
  const classes = useStyles()
  const cropper = useRef()
  const save = () => {
    onSave(cropper.current.getCroppedCanvas())
  }
  return (
    <Dialog {...props}>
      <DialogContent>
        <Cropper
          ref={cropper}
          className={classes.cropper}
          src={src}
          rotatable
        />
        <Button onClick={() => {
          cropper.current.rotate(90)
        }}>
          rotate
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={save}>
          save
        </Button>
        <Button onClick={onCancel}>
          cancel
        </Button>
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

export default ({element, onClose, uploadDirectory, ...props}) => {
  const classes = useStyles()
  const inputRef = useRef()
  const editor = useEditor()
  const [file, setFile] = useState()
  const [previewSrc, setPreviewSrc] = useState()
  const [croppedCanvas, setCroppedCanvas] = useState()
  const [editing, setEditing] = useState(false)

  const insert = () => {
    const destinationUri = `${uploadDirectory}${nameForFile(file)}`
    croppedCanvas.toBlob(async (blob) => {
      const response = await auth.fetch(destinationUri, {
        method: 'PUT',
        force: true,
        headers: {
          'content-type': file.type,
          credentials: 'include'
        },
        body: blob
      });
      if (response.ok){
        const insertAt = insertionPoint(editor, element)
        insertImage(editor, destinationUri, insertAt);
        Transforms.select(editor, insertAt)
      } else {
        console.log("image upload failed: ", response)
      }
      onClose()
    }, file.type, 1)
  }

  const onUploadComplete = uploadedFiles => {
  }

  useEffect(() => {
    let newSrc;
    if (file){
      newSrc = URL.createObjectURL(file)
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
    <Dialog className={classes.uploader} {...props}>
      <DialogContent>
        {previewSrc && (<img src={previewSrc} className={classes.previewImage}/>)}
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
      <ImageEditingModal open={editing} src={previewSrc} onSave={(canvas) => {
        setPreviewSrc(canvas.toDataURL(file.type))
        setCroppedCanvas(canvas)
        setEditing(false)
      }}/>
    </Dialog>
  )
}

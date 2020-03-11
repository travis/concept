import React, { useContext, useState, useEffect } from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import SaveIcon from '@material-ui/icons/Save'

import { schema} from 'rdf-namespaces';
import { useDebounce } from 'use-debounce';
import { useParams } from "react-router-dom";

import { Slate } from 'slate-react';

import Editable, {useEditor} from "./Editable";
import EditorToolbar from "./EditorToolbar";
import SharingModal from "./SharingModal";
import BackupsDialog from "./BackupsDialog";

import WorkspaceContext from "../context/workspace";
import PageDrawer from './PageDrawer';
import { LiveUpdate } from "@solid/react";
import { useLDflex } from '../hooks/ldflex';
import { useAccessInfo } from '../hooks/acls';
import { useBackups } from '../hooks/backup';

const useStyles = makeStyles(theme => ({
  saving: {
    position: "absolute",
    left: theme.spacing(2),
    top: 0,
    zIndex: 1000
  },
  editor: {
    textAlign: "left",
    padding: theme.spacing(2),
    background: "white",
    position: "relative",
    height: "600em"
  },
  toolbar: {
    minHeight: theme.spacing(1),
    paddingLeft: 0
  },
  shareButton: {
    float: "right"
  }
}));

function PageName({workspace, page}){
  const {updatePage} = useContext(WorkspaceContext);
  const [editing, setEditing] = useState(false);
  const [savedNameNode] = useLDflex(`[${page}][${schema.name}]`);
  const savedName = savedNameNode && savedNameNode.toString();
  const [name, setName] = useState(savedName);
  useEffect(() => {
    savedName && setName(`${savedName}`);
  }, [savedName])

  const saveAndStopEditing = async () => {
    setEditing(false)
    await updatePage(page, schema.name, name)
  }

  return editing ? (
    <TextField label="Page Name" variant="standard" autoFocus
               value={name}
               onKeyDown={(e) => (e.key === 'Enter') && saveAndStopEditing()}
               onBlur={() => saveAndStopEditing()}
               onChange={(e) => setName(e.target.value)}/>
  ) : (
    <Typography variant="h5" onClick={() => setEditing(true)}>{name}</Typography>
  );
}

function PageTextEditor({page, readOnly}){
  const {updatePage} = useContext(WorkspaceContext);
  const classes = useStyles();
  const [saving, setSaving] = useState(false);
  const [pageTextNode] = useLDflex(`[${page}][${schema.text}]`);
  const pageText = pageTextNode && pageTextNode.value;
  const [editorValue, setEditorValue] = useState(undefined);
  const [saveNeeded, setSaveNeeded] = useState(false);
  const [debouncedValue] = useDebounce(editorValue, 1000);
  useBackups(page, editorValue)
  useEffect(() => {
    // set editor text to null when the page changes so we won't save page text from another page to the current page
    setEditorValue(undefined);
  }, [page])

  useEffect(() => {
    // once pageText loads, set editorValue
    if ((pageText !== undefined) && (pageText !== null)) {
      setEditorValue(JSON.parse(pageText))
    }
  }, [pageText]);

  useEffect(() => {
    const maybeSave = async () => {
      const saveableText = JSON.stringify(debouncedValue);
      if (saveableText !== pageText) {
        setSaving(true);
        await updatePage(page, schema.text, saveableText);
        setSaving(false);
      }
    }
    if (saveNeeded) {
      setSaveNeeded(false);
      maybeSave();
    }
  }, [saveNeeded, page, pageText, debouncedValue, updatePage])

  useEffect(() => {
    if (debouncedValue !== undefined) {
      setSaveNeeded(true);
    }
  }, [debouncedValue])

  const editor = useEditor()
  return (
    <>
      {saving && <SaveIcon className={classes.saving}/>}
      <Slate editor={editor}
             value={(editorValue === undefined) ? [] : editorValue}
             onChange={value => setEditorValue(value)}>
        {!readOnly && <EditorToolbar className={classes.toolbar} />}
        <Paper className={classes.editor}>
          <Editable autoFocus readOnly={readOnly || saving} editor={editor}/>
        </Paper>
      </Slate>
    </>
  );
}

class EditorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.log("error rendering editable", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

function Page({workspace, page}){
  const classes = useStyles();
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const [backupsDialogOpen, setBackupsDialogOpen] = useState(false);
  const pageUri = page.toString()
  const { aclUri, allowed} = useAccessInfo(pageUri)
  const readOnly = !(allowed && allowed.user.has("write"))
  return (
    <>
      {
        allowed && allowed.user.has("control") && (
          <div>
            <Button className={classes.shareButton}
                    onClick={() => setSharingModalOpen(!sharingModalOpen)}>
              Share
            </Button>
            <Button onClick={() => setBackupsDialogOpen(!backupsDialogOpen)}>
              Backups
            </Button>
          </div>
        )
      }
      <LiveUpdate subscribe={[workspace.toString()]}>
        <PageName workspace={workspace} page={page} />
      </LiveUpdate>
      {aclUri && (
        <LiveUpdate subscribe={aclUri}>
          {page && (<SharingModal page={page} aclUri={aclUri} open={sharingModalOpen} onClose={() => setSharingModalOpen(false)}/>)}
        </LiveUpdate>
      )}
      {backupsDialogOpen && <BackupsDialog page={page} open={backupsDialogOpen} handleClose={() => setBackupsDialogOpen(false)}/>}
      {allowed && (
        <EditorErrorBoundary>
          <LiveUpdate subscribe={page.toString()}>
            <PageTextEditor page={page.toString()} readOnly={readOnly}/>
          </LiveUpdate>
        </EditorErrorBoundary>
      )}
    </>
  )
}

const usePagesStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    marginLeft: 240,
    position: "relative",
  },
}));

function CurrentPage({workspace}) {
  const { selectedPage } = useParams();
  const selectedPageURI = decodeURIComponent(selectedPage)
  return selectedPage ? (
    <LiveUpdate subscribe={selectedPageURI.toString()}>
      <Page workspace={workspace} page={selectedPageURI}/>
    </LiveUpdate>
  ) : (
    <p>Welcome to Concept! Add or select a page on the left to get started.</p>
  )
}

export default function Pages({workspace, addPage}){
  const classes = usePagesStyles()
  return (
    <>
      {workspace ? (
        <LiveUpdate subscribe={[workspace.toString()]}>
          <PageDrawer {...{workspace}}/>
        </LiveUpdate>
      ) : (
        <PageDrawer/>
      )}
      <Box className={classes.content}>
        {workspace && <CurrentPage workspace={workspace}/>}
      </Box>
    </>
  )
}

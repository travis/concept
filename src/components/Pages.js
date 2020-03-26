import React, { useContext, useState, useEffect, useCallback, useRef } from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import IconButton from './IconButton';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';

import SaveIcon from '@material-ui/icons/Save'
import ShareIcon from '@material-ui/icons/Share'
import BackupIcon from '@material-ui/icons/Backup'
import MenuIcon from '@material-ui/icons/Menu'

import { schema} from 'rdf-namespaces';
import { useDebounce } from 'use-debounce';
import { useHistory } from "react-router-dom";

import { Slate } from 'slate-react';

import Editable, {useNewEditor} from "./Editable";
import {HoveringToolbar} from "./EditorToolbar";
import SharingModal from "./SharingModal";
import BackupsDialog from "./BackupsDialog";

import WorkspaceContext from "../context/workspace";
import PageContext from '../context/page'

import PageDrawer from './PageDrawer';
import { LiveUpdate } from "@solid/react";
import { useLDflex } from '../hooks/ldflex';
import { useAccessInfo } from '../hooks/acls';
import { useBackups } from '../hooks/backup';
import { useCurrentPage } from '../hooks/pages';
import {drawerWidth} from '../constants'

const useStyles = makeStyles(theme => ({
  saving: {
    position: "fixed",
    right: theme.spacing(0),
    top: "78px",
    zIndex: 1000,
    color: theme.palette.primary.light
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    background: "white"
  },
  editor: {
    position: "relative",
    height: "100%",
    overflow: "scroll"
  },
  editable: {
    marginTop: "48px",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "left",
    padding: theme.spacing(1),
    paddingLeft: theme.spacing(8),
    paddingRight: theme.spacing(8),
    paddingTop: 0,
    background: "white",
    position: "absolute"

  },
  shareButton: {
    float: "right"
  },
  grow: {
    flexGrow: 1,
  },
  sectionDesktop: {
    display: 'flex',
  },
}));

function PageName({page}){
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
    <TextField variant="standard" autoFocus
               value={name}
               onKeyDown={(e) => (e.key === 'Enter') && saveAndStopEditing()}
               onBlur={() => saveAndStopEditing()}
               onChange={(e) => setName(e.target.value)}/>
  ) : (
    <Typography variant="h5" onClick={() => setEditing(true)} noWrap>{name}</Typography>
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
  const [debouncedValue] = useDebounce(editorValue, 1500);
  const savedVersionsRef = useRef([])
  const setSavedVersions = useCallback(
    (mutate) => {
      savedVersionsRef.current = mutate(savedVersionsRef.current)
    },
    [savedVersionsRef]
  )
  const editor = useNewEditor()

  useEffect(() => {
    // set editor text to null when the page changes so we won't save page text from another page to the current page
    editor.children = undefined
    setEditorValue(undefined);
    savedVersionsRef.current = []
  }, [editor, page])

  useBackups(page, editorValue)

  const previouslySaved = useCallback(
    (text) => savedVersionsRef.current.some(previousVersion => previousVersion === text),
    [savedVersionsRef]
  )

  useEffect(() => {
    // once pageText loads, set editorValue
    if ((pageText !== undefined) && (pageText !== null)) {
      setEditorValue(currentValue => {
        if ((JSON.stringify(currentValue) === pageText) ||
            previouslySaved(pageText)){
          return currentValue
        } else {
          return JSON.parse(pageText)
        }
      })
    }
  }, [pageText, previouslySaved, savedVersionsRef]);

  useEffect(() => {
    const maybeSave = async () => {
      const saveableText = JSON.stringify(debouncedValue);
      if (saveableText !== pageText) {
        setSaving(true);
        await updatePage(page, schema.text, saveableText);
        setSavedVersions(currentSavedVersions => [saveableText, ...currentSavedVersions].slice(0, 100))
        setSaving(false);
      }
    }
    if (saveNeeded) {
      setSaveNeeded(false);
      maybeSave();
    }
  }, [saveNeeded, page, pageText, debouncedValue, updatePage, setSavedVersions])

  useEffect(() => {
    if (debouncedValue !== undefined) {
      setSaveNeeded(true);
    }
  }, [debouncedValue])

  return (
    <Paper className={classes.editor}>
      {saving && <SaveIcon className={classes.saving}/>}
      {editorValue === undefined ? (
        <div>Loading...</div>
      ) : (
        <Slate editor={editor}
               value={editorValue === undefined ? [] : editorValue}
               onChange={newValue => setEditorValue(newValue)}>
          {!readOnly && (
            <>
              <HoveringToolbar />
            </>
          )}

          <Editable autoFocus readOnly={readOnly} editor={editor}
                    className={classes.editable}/>
        </Slate>
      )}
    </Paper>
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
    // just render the children - react will recreate from scratch
    return this.props.children;
  }
}

function AppBarMenu({page, onClose, onDelete, ...props}){
  const history = useHistory();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const {deletePage} = useContext(WorkspaceContext);
  const close = () => {
    setDeleteConfirmationOpen(false)
    onClose()
  }
  return (
    <>
      <Menu onClose={onClose} {...props}>
        <MenuItem>
          <Link href={page} target="_blank" rel="noopener noreferrer" color="inherit">
            Source
          </Link>
        </MenuItem>
        <MenuItem onClick={() => setDeleteConfirmationOpen(true)}>Delete</MenuItem>
      </Menu>
      <Dialog open={deleteConfirmationOpen} onClose={onClose}>
        <DialogTitle>Are you sure you want to delete this page?</DialogTitle>
        <DialogActions>
          <Button  color="primary" onClick={() => {
            deletePage(page)
            close()
            history.replace("/")
          }}>
            yes
          </Button>
          <Button color="primary" autoFocus onClick={close}>
            no
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function Page({page}){
  const menuButton = useRef();
  const classes = useStyles();
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const [backupsDialogOpen, setBackupsDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false)
  const pageUri = page.toString()
  const { aclUri, allowed} = useAccessInfo(pageUri)
  const readOnly = !(allowed && allowed.user.has("write"))
  return (
    <PageContext.Provider value={page}>
      <AppBar position="fixed" className={classes.appBar} color="transparent" elevation={0}>
        <Toolbar variant="dense">
          <PageName page={page} />
          <div className={classes.grow} />
          <div className={classes.sectionDesktop}>
            {
              allowed && allowed.user.has("control") && (
              <>
                <IconButton title="share"
                            onClick={() => setSharingModalOpen(!sharingModalOpen)}>
                  <ShareIcon/>
                </IconButton>
                <IconButton title="backups"
                            onClick={() => setBackupsDialogOpen(!backupsDialogOpen)}>
                  <BackupIcon/>
                </IconButton>
                <IconButton ref={menuButton} title="menu"
                            onClick={() => setMenuOpen(!menuOpen)} >
                  <MenuIcon />
                </IconButton>
              </>
              )
            }
          </div>
        </Toolbar>
      </AppBar>
      <AppBarMenu page={page}
                  open={menuOpen} anchorEl={menuButton.current}
                  onClose={() => setMenuOpen(false)}
                  keepMounted
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}/>
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
    </PageContext.Provider>
  )
}

const usePagesStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    marginLeft: 240,
    position: "relative",
    height: "100%"
  },
}));

function CurrentPage() {
  const currentPage = useCurrentPage()
  return currentPage ? (
    <LiveUpdate subscribe={currentPage}>
      <Page page={currentPage}/>
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
          <PageDrawer workspace={workspace}/>
        </LiveUpdate>
      ) : (
        <PageDrawer/>
      )}
      <Box className={classes.content}>
        {workspace && <CurrentPage />}
      </Box>
    </>
  )
}

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
import PageTextEditor from './PageTextEditor'
import { LiveUpdate } from "@solid/react";
import { useLDflex } from '../hooks/ldflex';
import { useAccessInfo } from '../hooks/acls';
import { useBackups } from '../hooks/backup';
import { useCurrentPage } from '../hooks/pages';
import {drawerWidth} from '../constants'

const useStyles = makeStyles(theme => ({
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    background: "white"
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
  const savedName = page.name
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
          <Link href={page.uri} target="_blank" rel="noopener noreferrer" color="inherit">
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
  const {workspace} = useContext(WorkspaceContext)
  const menuButton = useRef();
  const classes = useStyles();
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const [backupsDialogOpen, setBackupsDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false)
  const pageUri = page.uri
  const { aclUri, allowed } = useAccessInfo(pageUri)
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
        <LiveUpdate subscribe={[aclUri, workspace.publicPages]}>
          {page && (<SharingModal page={page} aclUri={aclUri} open={sharingModalOpen} onClose={() => setSharingModalOpen(false)}/>)}
        </LiveUpdate>
      )}
      {backupsDialogOpen && <BackupsDialog page={page} open={backupsDialogOpen} handleClose={() => setBackupsDialogOpen(false)}/>}
      {allowed && (
        <EditorErrorBoundary>
          <LiveUpdate subscribe={page.uri}>
            <PageTextEditor page={page.uri} readOnly={readOnly}/>
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
  const [currentPage] = useCurrentPage()
  return currentPage ? (
    <LiveUpdate subscribe={currentPage.uri}>
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
        <LiveUpdate subscribe={[workspace.uri]}>
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

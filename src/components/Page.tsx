import React, { useContext, useState, useEffect, useRef, ReactNode } from 'react'

import { makeStyles } from '@material-ui/core/styles';
import IconButton from './IconButton';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Menu, { MenuProps } from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';

import ShareIcon from '@material-ui/icons/Share'
import BackupIcon from '@material-ui/icons/Backup'
import MenuIcon from '@material-ui/icons/Menu'

import { schema } from 'rdf-namespaces';
import { useHistory } from "react-router-dom";


import SharingModal from "./SharingModal";
import BackupsDialog from "./BackupsDialog";

import WorkspaceContext from "../context/workspace";
import PageContext from '../context/page'

import PageTextEditor from './PageTextEditor'
import { LiveUpdate } from "@solid/react";
import { useAccessInfo } from '../hooks/acls';
import { drawerWidth } from '../constants'
import { Page } from '../utils/model'

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

type PageNameProps = {
  page: Page
}

function PageName({ page }: PageNameProps) {
  const { updatePage } = useContext(WorkspaceContext);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(page.name);
  useEffect(() => {
    page.name && setName(page.name);
  }, [page.name, page.uri])

  const saveAndStopEditing = async () => {
    setEditing(false)
    if (updatePage) {
      await updatePage(page, schema.name, name)
    }
  }

  return editing ? (
    <TextField variant="standard" autoFocus
      value={name}
      onKeyDown={(e) => (e.key === 'Enter') && saveAndStopEditing()}
      onBlur={() => saveAndStopEditing()}
      onChange={(e) => setName(e.target.value)} />
  ) : (
      <Typography variant="h5" onClick={() => setEditing(true)} noWrap>{name}</Typography>
    );
}
type EditorErrorBoundaryProps = { children: ReactNode }
type EditorErrorBoundaryState = { hasError: boolean }

class EditorErrorBoundary extends React.Component<EditorErrorBoundaryProps, EditorErrorBoundaryState> {
  constructor(props: EditorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can also log the error to an error reporting service
    console.log("error rendering editable", error, errorInfo);
  }

  render() {
    // just render the children - react will recreate from scratch
    return this.props.children;
  }
}

interface AppBarMenuProps extends MenuProps {
  open: boolean,
  page: Page,
  onClose: () => void
}

function AppBarMenu({ page, onClose, ...props }: AppBarMenuProps) {
  const history = useHistory();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const { deletePage } = useContext(WorkspaceContext);
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
          <Button color="primary" onClick={() => {
            if (deletePage) {
              deletePage(page)
            }
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

type PageProps = {
  page: Page
}

export default function PageComponent({ page }: PageProps) {
  const { workspace } = useContext(WorkspaceContext)
  const menuButton = useRef<HTMLButtonElement | null>(null);
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
                    <ShareIcon />
                  </IconButton>
                  <IconButton title="backups"
                    onClick={() => setBackupsDialogOpen(!backupsDialogOpen)}>
                    <BackupIcon />
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
        }} />
      {workspace && aclUri && (
        <LiveUpdate subscribe={[aclUri, workspace.publicPages]}>
          {page && (<SharingModal page={page} aclUri={aclUri} open={sharingModalOpen} onClose={() => setSharingModalOpen(false)} />)}
        </LiveUpdate>
      )}
      {backupsDialogOpen && <BackupsDialog page={page} open={backupsDialogOpen} handleClose={() => setBackupsDialogOpen(false)} />}
      {allowed && (
        <EditorErrorBoundary>
          <LiveUpdate subscribe={page.uri}>
            <PageTextEditor page={page} readOnly={readOnly} />
          </LiveUpdate>
        </EditorErrorBoundary>
      )}
    </PageContext.Provider>
  )
}

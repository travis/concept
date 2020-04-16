import React, { useContext, useState, useEffect, useRef, ReactNode, FunctionComponent } from 'react'

import { LiveUpdate } from "@solid/react";

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
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';

import ShareIcon from '@material-ui/icons/Share'
import BackupIcon from '@material-ui/icons/Backup'
import MenuIcon from '@material-ui/icons/Menu'
import DeveloperModeIcon from '@material-ui/icons/DeveloperMode'

import { useHistory } from "react-router-dom";

import Link from './Link';
import SharingModal from "./SharingModal";
import BackupsDialog from "./BackupsDialog";
import Loader from "./Loader";

import WorkspaceContext from "../context/workspace";
import DocumentContext from '../context/document'

import DocumentTextEditor from './DocumentTextEditor'
import ReferencedByList from './ReferencedByList'
import { useAccessInfo } from '../hooks/acls';
import { drawerWidth } from '../constants'
import { Page, Document, isConcept, isPage } from '../utils/model'
import { usePreferences } from '../context/preferences'

const useStyles = makeStyles(theme => ({
  appBar: {
    width: ({ hasWorkspace }: any) => hasWorkspace ? `calc(100% - ${drawerWidth}px)` : "100%",
    marginLeft: ({ hasWorkspace }: any) => hasWorkspace ? drawerWidth : 0,
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
  referencedBy: {
    flexGrow: 2
  },
  error: {
    marginTop: theme.spacing(6)
  }
}));

type PageNameProps = {
  page: Page
}

function PageName({ page }: PageNameProps) {
  const { updateName } = useContext(WorkspaceContext);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(page.name);
  useEffect(() => {
    page.name && setName(page.name);
  }, [page.name, page.uri])

  const saveAndStopEditing = async () => {
    setEditing(false)
    if (updateName) {
      await updateName(page, name)
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

type DocumentNameProps = {
  document: Document
}

function DocumentName({ document }: DocumentNameProps) {
  return (
    <Typography variant="h5" noWrap>{document.name}</Typography>
  );
}

type PE = FunctionComponent<{
  error: any
}>

const PageError: PE = ({ error }) => {
  const classes = useStyles()
  console.log("showing error ui for ", error)
  return (<div className={classes.error}>Sorry, something went wrong.</div>)

}

type EditorErrorBoundaryProps = { children: ReactNode }
type EditorErrorBoundaryState = { hasError: boolean, error: any }

class EditorErrorBoundary extends React.Component<EditorErrorBoundaryProps, EditorErrorBoundaryState> {
  constructor(props: EditorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can also log the error to an error reporting service
    console.log("error rendering editable", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (<PageError error={this.state.error} />)
    } else {
      return this.props.children;
    }
  }
}

interface AppBarMenuProps extends MenuProps {
  open: boolean,
  document: Document,
  onClose: () => void
}

function AppBarMenu({ document, onClose, ...props }: AppBarMenuProps) {
  const history = useHistory();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const { deleteDocument } = useContext(WorkspaceContext);
  const close = () => {
    setDeleteConfirmationOpen(false)
    onClose()
  }
  return (
    <>
      <Menu onClose={onClose} {...props}>
        <MenuItem>
          <Link href={document.uri} target="_blank" rel="noopener noreferrer" color="inherit">
            Source
          </Link>
        </MenuItem>
        <MenuItem onClick={() => setDeleteConfirmationOpen(true)}>Delete</MenuItem>
      </Menu>
      <Dialog open={deleteConfirmationOpen} onClose={onClose}>
        <DialogTitle>Are you sure you want to delete this page?</DialogTitle>
        <DialogActions>
          <Button color="primary" onClick={() => {
            if (deleteDocument) {
              deleteDocument(document)
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

type DocumentProps = {
  document: Document
}

const DocumentComponent: FunctionComponent<DocumentProps> = ({ document }) => {
  const { workspace } = useContext(WorkspaceContext)
  const menuButton = useRef<HTMLButtonElement | null>(null);
  const classes = useStyles({ hasWorkspace: !!workspace });
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const [backupsDialogOpen, setBackupsDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false)
  const { aclUri, allowed } = useAccessInfo(document.uri)
  const readOnly = !(allowed && allowed.user.has("write"))
  const { devMode, setDevMode } = usePreferences()
  return (document === undefined) ? (<Loader />) : (
    <DocumentContext.Provider value={document}>
      <AppBar position="fixed" className={classes.appBar} color="transparent" elevation={0}>
        <Toolbar variant="dense">
          {isPage(document) ? (
            <PageName page={document} />
          ) : (
              <DocumentName document={document} />
            )}
          <div className={classes.grow} />
          <div className={classes.sectionDesktop}>
            {

              allowed && allowed.user.has("control") && (
                <>
                  <IconButton title="DEV MODE" active={devMode}
                              onClick={() => setDevMode(!devMode)}>
                    <DeveloperModeIcon />
                  </IconButton>
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
      <AppBarMenu document={document}
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
          {document && (<SharingModal document={document} aclUri={aclUri} open={sharingModalOpen} onClose={() => setSharingModalOpen(false)} />)}
        </LiveUpdate>
      )}
      {backupsDialogOpen && <BackupsDialog document={document} open={backupsDialogOpen} handleClose={() => setBackupsDialogOpen(false)} />}
      {allowed && allowed.user.has("read") && (
        <Box display="flex" flexDirection="column" height="100%">
          <Box flexGrow={1}>
            <EditorErrorBoundary>
              <LiveUpdate subscribe={[document.uri]}>
                <DocumentTextEditor document={document} readOnly={readOnly} />
              </LiveUpdate>
            </EditorErrorBoundary>
          </Box>
          {isConcept(document) && (
            <Box flexGrow={5}>
              <Paper>
                <ReferencedByList concept={document} />
              </Paper>
            </Box>
          )}
        </Box>
      )}
    </DocumentContext.Provider>
  )
}

export default DocumentComponent;

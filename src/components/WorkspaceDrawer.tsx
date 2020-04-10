import React, { useContext, useState, useCallback, useRef } from 'react';
import { useParams, Link } from "react-router-dom";
import { LiveUpdate, useWebId } from "@solid/react";
import { vcard } from 'rdf-namespaces';

import { makeStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

import ArrowRight from '@material-ui/icons/ArrowRight';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import { useHistory } from "react-router-dom";

import { useAuthContext } from "../context/auth"
import WorkspaceContext from "../context/workspace";
import { useValueQuery, usePageListItems, useConceptListItems, usePageFromPageListItem } from '../hooks/data';
import {
  Workspace, PageContainer, ConceptContainer,
  PageListItem as PageListItemType, ConceptListItem as ConceptListItemType,
} from '../utils/model'
import { pagePath, conceptPath } from '../utils/urls';
import { drawerWidth } from '../constants'

import IconButton from './IconButton';
import ProfileLink from './ProfileLink';
import Loader from './Loader';
import ConceptCreator from './ConceptCreator';

type WithLevel = { level?: number }

const useStyles = makeStyles(theme => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    paddingTop: theme.spacing(2)
  },
  toolbar: theme.mixins.toolbar,
  logo: {
    height: "4em",
    paddingTop: theme.spacing(1),
  },
  version: {
    fontWeight: theme.typography.fontWeightBold,
    display: "inline-block",
  },
  avatar: {
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(1),
    height: theme.spacing(3),
    width: theme.spacing(3)
  },
  item: {
    paddingLeft: ({ level = 0 }: WithLevel) => theme.spacing(1 + (level * 2)),
    paddingRight: theme.spacing(1),
    paddingTop: 0,
    paddingBottom: 0,
    "& a": {
      width: "100%",
      textDecoration: "none",
      color: theme.palette.text.primary,
      "&:visited": {
        color: theme.palette.text.primary
      }
    }
  },
  sidebarItem: {
    "&:hover $sidebarItemHoverButton": {
      visibility: "visible"
    }
  },
  conceptListItem: {
    paddingLeft: theme.spacing(3)
  },
  sidebarItemHoverButton: {
    visibility: "hidden",
    opacity: 0.5,
    padding: 0
  },
  userSidebarItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2)
  },
  sectionTitle: {
    display: "flex",
    justifyContent: "space-between",
    paddingLeft: theme.spacing(1)
  },
  sectionTitleButton: {
    padding: 0,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    fontSize: "0.83em"
  },
  sectionTitleButtonLabel: {
  },
  sectionTitleRightButton: {
    float: "right",
    marginRight: theme.spacing(1)
  },
  noInnerPages: {
    marginLeft: theme.spacing(3),
    color: theme.palette.grey[500],
    paddingTop: 0,
    paddingBottom: 0
  },
  loaderListItem: {
    paddingLeft: ({ level = 0 }: WithLevel) => theme.spacing(4 + (level * 2)),
  },
  menuLink: {
    color: "inherit",
    textDecoration: "none"
  }
}));

type SubPageListItemsProps = {
  level: number,
  pageListItem: PageListItemType
}

const SidebarLoader = () => <Loader type="ThreeDots" width={3} height={1} />

function SubPageListItems({ pageListItem, level }: SubPageListItemsProps) {
  const classes = useStyles({ level })
  const [page] = usePageFromPageListItem(pageListItem)
  const [subPageListItems] = usePageListItems(page)

  if (page && subPageListItems) {
    if (subPageListItems.length === 0) {
      return <ListItem className={classes.noInnerPages}>no inner pages</ListItem>
    } else {
      return <>
        {subPageListItems.map((subPageListItem, index) => (
          <LiveUpdate subscribe={[subPageListItem.pageUri]} key={index}>
            <PageListItem parent={page} pageListItem={subPageListItem} key={index} level={level} />
          </LiveUpdate>
        ))}
      </>
    }
  } else {
    return <></>
  }
}

type PageListItemProps = {
  parent: PageContainer,
  pageListItem: PageListItemType,
  level?: number
}

function PageListItem({ parent, pageListItem, level = 0 }: PageListItemProps) {
  const history = useHistory();
  const { addSubPage } = useContext(WorkspaceContext);
  const [adding, setAdding] = useState(false)
  const [showSubpages, setShowSubpages] = useState(false)
  const { selectedPage } = useParams();
  const classes = useStyles({ level })
  const pageUri = pageListItem.pageUri
  const encodedPage = pageUri && encodeURIComponent(pageUri)
  return (
    <>
      <ListItem dense={true} selected={selectedPage === encodedPage} className={`${classes.item} ${classes.sidebarItem}`}>
        {showSubpages ? (
          <IconButton title="hide subpages" className={classes.sidebarItemHoverButton}
            onClick={() => setShowSubpages(false)}>
            <ArrowDown fontSize="small" />
          </IconButton>
        ) : (
            <IconButton title="show subpages" className={classes.sidebarItemHoverButton}
              onClick={() => setShowSubpages(true)}>
              <ArrowRight fontSize="small" />
            </IconButton>
          )}
        <Link to={pagePath(pageUri)}>
          <ListItemText primary={`${pageListItem.name || ""}`} />
        </Link>
        <IconButton title="add inner page" className={classes.sidebarItemHoverButton}
          onClick={async () => {
            if (addSubPage) {
              setShowSubpages(true)
              setAdding(true)
              const page = await addSubPage({}, pageListItem)
              setAdding(false)
              if (page) {
                history.push(pagePath(page.uri))
              }
            }
          }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </ListItem>
      {showSubpages && (
        <SubPageListItems pageListItem={pageListItem} level={level + 1} />
      )}
      {adding && <ListItem className={classes.loaderListItem}><SidebarLoader /></ListItem>}
    </>
  )
}

const PageNameList = ({ pageListItems, workspace, adding }: { pageListItems: PageListItemType[], workspace: Workspace, adding?: boolean }) => {
  const classes = useStyles()
  return (
    <List>
      {pageListItems && pageListItems.map((pageListItem) => (
        <LiveUpdate subscribe={[pageListItem.pageUri]} key={pageListItem.uri}>
          <PageListItem parent={workspace} pageListItem={pageListItem} />
        </LiveUpdate>
      ))}

      {adding && <ListItem className={classes.loaderListItem}><SidebarLoader /></ListItem>}
    </List>
  )
}


type ConceptListItemProps = {
  parent: ConceptContainer,
  conceptListItem: ConceptListItemType
}

function ConceptListItem({ parent, conceptListItem }: ConceptListItemProps) {
  const { selectedConcept } = useParams();
  const classes = useStyles()
  const conceptUri = conceptListItem.conceptUri
  const encodedConcept = conceptUri && encodeURIComponent(conceptUri)
  return (
    <>
      <ListItem dense={true} selected={selectedConcept === encodedConcept} className={`${classes.item} ${classes.sidebarItem}`}>
        <Link to={conceptPath(conceptUri)} className={classes.conceptListItem}>
          <ListItemText primary={`${conceptListItem.name || ""}`} />
        </Link>
      </ListItem>
    </>
  )
}

const ConceptNameList = ({ conceptListItems, workspace, adding }: { conceptListItems: ConceptListItemType[], workspace: Workspace, adding?: boolean }) => {
  const classes = useStyles()
  return (
    <List>
      {conceptListItems && conceptListItems.map((conceptListItem) => (
        <ConceptListItem parent={workspace} conceptListItem={conceptListItem} key={conceptListItem.uri} />
      ))}

      {adding && <ListItem className={classes.loaderListItem}><SidebarLoader /></ListItem>}
    </List>
  )
}

function AvatarMenu({ name, photo }: { name: string, photo: string }) {
  const webId = useWebId()
  const avatarRef = useRef<HTMLDivElement>(null)
  const classes = useStyles({})
  const { logOut } = useAuthContext()
  const [showMenu, setShowMenu] = useState(false)
  return (
    <>
      <Avatar ref={avatarRef} alt={name || ""} src={photo} className={classes.avatar}
        onClick={() => setShowMenu(!showMenu)} />
      <Menu anchorEl={avatarRef.current}
        open={showMenu}
        onClose={() => setShowMenu(false)}>
        <MenuItem>
          <ProfileLink webId={webId} color="inherit">
            profile
            </ProfileLink>
        </MenuItem>
        <MenuItem>
          <Link to="/what" className={classes.menuLink}>
            what is this?
            </Link>
        </MenuItem>
        <MenuItem onClick={() => logOut()}>
          log out
        </MenuItem>
      </Menu>
    </>
  )
}


type WorkspaceDrawerProps = {
  workspace: Workspace
}

const WorkspaceDrawer = ({ workspace }: WorkspaceDrawerProps) => {
  const webId = useWebId()
  const [name] = useValueQuery(webId, vcard.fn)
  const [photo] = useValueQuery(webId, vcard.hasPhoto)
  const classes = useStyles({})
  const history = useHistory();
  const [pageListItems, pageListItemsLoading] = usePageListItems(workspace)
  const [showPages, setShowPages] = useState(true)
  const { addPage } = useContext(WorkspaceContext);
  const [addingPage, setAddingPage] = useState(false)
  const addNewPage = useCallback(async () => {
    setAddingPage(true)
    if (addPage) {
      const page = await addPage({}, { position: pageListItems ? pageListItems.length : 0 })
      if (page) {
        history.push(pagePath(page.uri))
      }
    }
    setAddingPage(false)
  }, [addPage, history, pageListItems])

  const [showConcepts, setShowConcepts] = useState(true)
  const [addingConcept, setAddingConcept] = useState(false)
  const [conceptListItems, conceptListItemsLoading] = useConceptListItems(workspace)
  const addNewConcept = useCallback(async () => {
    setAddingConcept(true)
  }, [])
  return (
    <Drawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
      anchor="left"
    >
      <div className={`${classes.sidebarItem} ${classes.userSidebarItem}`}>
        <AvatarMenu name={name} photo={photo} />
        <ProfileLink webId={webId} color="inherit">
          <Typography variant="subtitle2">{name}</Typography>
        </ProfileLink>
      </div>
      <div className={`${classes.sectionTitle} ${classes.sidebarItem}`}>
        <Tooltip title={showPages ? "hide pages" : "show pages"}>
          <Button size="small" className={classes.sectionTitleButton}
            onClick={() => setShowPages(!showPages)}>
            pages
                </Button>
        </Tooltip>
        <IconButton title="add a page"
          className={`${classes.sidebarItemHoverButton} ${classes.sectionTitleRightButton}`}
          onClick={() => addNewPage()}>
          <AddIcon fontSize="small" />
        </IconButton>
      </div>
      {pageListItems && showPages && <PageNameList pageListItems={pageListItems} workspace={workspace} adding={addingPage} />}
      {!pageListItems && pageListItemsLoading && <SidebarLoader />}
      {
        !pageListItemsLoading && pageListItems && (pageListItems.length === 0) && (
          <>
            <Button onClick={() => addNewPage()}>create your first page</Button>
          </>
        )
      }
      <div className={`${classes.sectionTitle} ${classes.sidebarItem}`}>
        <Tooltip title={showPages ? "hide concepts" : "show concepts"}>
          <Button size="small" className={classes.sectionTitleButton}
            onClick={() => setShowConcepts(!showConcepts)}>
            concepts
                </Button>
        </Tooltip>
        <IconButton title="add a concept"
          className={`${classes.sidebarItemHoverButton} ${classes.sectionTitleRightButton}`}
          onClick={() => addNewConcept()}>
          <AddIcon fontSize="small" />
        </IconButton>
      </div>
      {conceptListItems && showConcepts && <ConceptNameList conceptListItems={conceptListItems} workspace={workspace} adding={addingConcept} />}
      {!conceptListItems && conceptListItemsLoading && <SidebarLoader />}
      <ConceptCreator open={addingConcept} close={() => setAddingConcept(false)} />
    </Drawer >

  )
}

export default WorkspaceDrawer

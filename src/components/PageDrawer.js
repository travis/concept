import React, { useContext, useState, useCallback } from 'react';
import { useParams, Link } from "react-router-dom";
import { schema } from 'rdf-namespaces';
import { LiveUpdate } from "@solid/react";

import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Tooltip from '@material-ui/core/Tooltip';

import ArrowRight from '@material-ui/icons/ArrowRight';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';

import {useLDflexValue, useLDflexList} from '../hooks/ldflex';


import IconButton from './IconButton';
import WorkspaceContext from "../context/workspace";
import LogInLogOutButton from './LogInLogOutButton';
import {drawerWidth} from '../constants'
import logo from '../logo.svg'

const useStyles = makeStyles(theme => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
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
  item: {
    paddingLeft: ({level}) => theme.spacing(1 + (level * 2)),
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
  sidebarItemHoverButton: {
    visibility: "hidden",
    opacity: 0.5,
    padding: 0
  },
  sectionTitle: {
    textAlign: "left",
    paddingLeft: theme.spacing(2)
  },
  sectionTitleButton: {
    padding: 0,
    fontSize: "0.83em"
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
  }
}));

function SubPageListItems({page, level}){
  const classes = useStyles()
  const subPages = useLDflexList(`[${page}][${schema.itemListElement}]`);
  if (subPages) {
    if (subPages.length === 0) {
      return <ListItem className={classes.noInnerPages}>no inner pages</ListItem>
    } else {
      return subPages.map((subPage, index) => (
        <PageListItem parent={page} page={subPage} key={index} level={level}/>
      ))
    }
  } else {
    return null
  }
}

function PageListItem({parent, page, level=0}) {
  const {addPage} = useContext(WorkspaceContext);
  const [showSubpages, setShowSubpages] = useState(false)
  const { selectedPage } = useParams();
  const classes = useStyles({level})
  const name = useLDflexValue(`from('${parent}')[${page}][${schema.name}]`);
  const encodedPage = encodeURIComponent(page)
  return (
    <>
      <ListItem dense={true} selected={selectedPage === encodedPage} className={`${classes.item} ${classes.sidebarItem}`}>
        {showSubpages ? (
          <IconButton title="hide subpages" className={classes.sidebarItemHoverButton}
                      onClick={() => setShowSubpages(false)}>
            <ArrowDown fontSize="small"/>
          </IconButton>
        ) : (
          <IconButton title="show subpages" className={classes.sidebarItemHoverButton}
                      onClick={() => setShowSubpages(true)}>
            <ArrowRight fontSize="small"/>
          </IconButton>
        )}
        <Link to={`/page/${encodedPage}`}>
          <ListItemText primary={`${name || ""}`} />
        </Link>
        <IconButton title="add inner page" className={classes.sidebarItemHoverButton}
                    onClick={() => addPage({parent: page})}>
          <AddIcon fontSize="small"/>
        </IconButton>
      </ListItem>
      <LiveUpdate subscribe={[page.toString()]}>
        {showSubpages && <SubPageListItems page={page} level={level + 1}/>}
      </LiveUpdate>
    </>
  )
}

const PageNameList = ({workspace}) => {
  const pages = useLDflexList(`[${workspace}][${schema.itemListElement}]`);
  return (
    <List>
      {pages && pages.map((page, index) => (
        <PageListItem parent={workspace} page={page} key={index}/>
      ))}
    </List>
  )
}

export default ({workspace, deletePage}) => {
  const classes = useStyles()
  const [showPages, setShowPages] = useState(true)
  const {addPage} = useContext(WorkspaceContext);
  const [addingPage, setAddingPage] = useState(false)
  const addNewPage = useCallback(async () => {
    setAddingPage(true)
    await addPage()
    setAddingPage(false)
  }, [addPage])

  return (
    <Drawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
      anchor="left"
    >
      <div className={classes.toolbar}>
        <img src={logo} className={classes.logo} alt="logo"/>
        <p className={classes.version}>alpha</p>
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
                    onClick={() => addPage()}>
          <AddIcon fontSize="small"/>
        </IconButton>
      </div>
      {workspace && showPages && <PageNameList {...{workspace}}/>}
      <LogInLogOutButton/>
    </Drawer>

  )
}

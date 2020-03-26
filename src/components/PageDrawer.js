import React, { useContext, useState } from 'react';
import { useParams, Link } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ArrowRight from '@material-ui/icons/ArrowRight';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import {useLDflexValue, useLDflexList} from '../hooks/ldflex';
import { schema } from 'rdf-namespaces';
import { LiveUpdate } from "@solid/react";

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
    "& a": {
      width: "100%",
      textDecoration: "none",
      color: theme.palette.text.primary,
      "&:visited": {
        color: theme.palette.text.primary
      }
    },
    "&:hover $itemHoverButton": {
      visibility: "visible"
    }
  },
  itemHoverButton: {
    cursor: "pointer",
    visibility: "hidden",
    opacity: 0.5,
    padding: 0
  }
}));

function SubPageListItems({page, level}){
  const subPages = useLDflexList(`[${page}][${schema.itemListElement}]`);
  return (
    <>
      {subPages && subPages.map((subPage, index) => (
        <PageListItem parent={page} page={subPage} key={index} level={level}/>
      ))}
    </>
  )
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
      <ListItem dense={true} selected={selectedPage === encodedPage} className={classes.item}>
        {showSubpages ? (
          <IconButton title="hide subpages" className={classes.itemHoverButton}
                      onClick={() => setShowSubpages(false)}>
            <ArrowDown fontSize="small"/>
          </IconButton>
        ) : (
          <IconButton title="show subpages" className={classes.itemHoverButton}
                      onClick={() => setShowSubpages(true)}>
            <ArrowRight fontSize="small"/>
          </IconButton>
        )}
        <Link to={`/page/${encodedPage}`}>
          <ListItemText primary={`${name || ""}`} />
        </Link>
        <IconButton title="add a page inside" className={classes.itemHoverButton}
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
  const {addPage} = useContext(WorkspaceContext);
  const classes = useStyles()
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
      {workspace && <PageNameList {...{workspace}}/>}
      {workspace && <Button onClick={() => addPage()}>Add Page</Button>}
      <LogInLogOutButton/>
    </Drawer>

  )
}

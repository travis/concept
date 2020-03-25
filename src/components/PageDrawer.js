import React, { useContext, useState } from 'react';
import { useParams, Link } from "react-router-dom";
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
import { schema } from 'rdf-namespaces';

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
    "& a": {
      width: "100%",
      textDecoration: "none",
      color: theme.palette.text.primary,
      "&:visited": {
        color: theme.palette.text.primary
      }
    },
    "& button": {
      position: "absolute",
      right: 0
    },
    "&:hover $itemHoverButton": {
      visibility: "visible"
    }
  },
  itemHoverButton: {
    cursor: "pointer",
    visibility: "hidden",
    opacity: 0.5
  }
}));

function SubPageListItems({workspace, page}){
  const pages = useLDflexList(`from('${workspace}')[${page}][${schema.itemListElement}]`);
  return (
    <>
      {pages && pages.map((page, index) => (
        <PageListItem workspace={workspace} page={page} key={index}/>
      ))}
    </>
  )
}

function PageListItem({workspace, page}) {
  const {deletePage, addPage} = useContext(WorkspaceContext);
  const [showSubpages, setShowSubpages] = useState(false)
  const { selectedPage } = useParams();
  const classes = useStyles()
  const name = useLDflexValue(`from('${workspace}')[${page}][${schema.name}]`);
  const encodedPage = encodeURIComponent(page)
  return (
    <>
      <ListItem dense={true} selected={selectedPage === encodedPage} className={classes.item}>
        {showSubpages ? (
          <Tooltip title="hide subpages" aria-label="hide subpages">
            <ArrowDown fontSize="small" className={classes.itemHoverButton}
                        onClick={() => setShowSubpages(false)}/>
          </Tooltip>
        ) : (
          <Tooltip title="show subpages" aria-label="show subpages">
            <ArrowRight fontSize="small" className={classes.itemHoverButton}
                        onClick={() => setShowSubpages(true)}/>
          </Tooltip>
        )}
        <Link to={`/page/${encodedPage}`}>
          <ListItemText primary={`${name || ""}`} />
        </Link>
        <Tooltip title="add a page inside" aria-label="add a page inside">
          <AddIcon fontSize="small" className={classes.itemHoverButton}
                   onClick={() => addPage({parent: page})}/>
        </Tooltip>
      </ListItem>
      {showSubpages && <SubPageListItems workspace={workspace} page={page}/>}
    </>
  )
}

const PageNameList = ({workspace}) => {
  const pages = useLDflexList(`[${workspace}][${schema.itemListElement}]`);
  return (
    <List>
      {pages && pages.map((page, index) => (
        <PageListItem workspace={workspace} page={page} key={index}/>
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

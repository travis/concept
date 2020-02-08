import React, {useContext, useEffect} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import {useLDflexValue, useLDflexList} from '../hooks/ldflex';
import { schema } from 'rdf-namespaces';

import WorkspaceContext from "../context/workspace";
import LogInLogOutButton from './LogInLogOutButton';
import logo from '../logo.svg'

const drawerWidth = 240;

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
    paddingTop: "0.5em",
    float: "left",
    paddingLeft: "0.5em"
  }
}));

const PageListItem = ({workspace, page, setSelectedPage}) => {
  const {deletePage} = useContext(WorkspaceContext);
  const name = useLDflexValue(`from('${workspace}')[${page}][${schema.name}]`);
  return (
    <ListItem button onClick={() => setSelectedPage()}>
      <ListItemText primary={`${name || ""}`} />
      <Button onClick={() => deletePage(page)}>Delete</Button>
    </ListItem>
  )
}

const PageNameList = ({workspace, selectedPage, setSelectedPage}) => {
  const pages = useLDflexList(`[${workspace}][${schema.itemListElement}]`);
  useEffect(() => {
    if (pages && (selectedPage == null)){
      setSelectedPage(pages[0]);
    }
  }, [pages, selectedPage, setSelectedPage])
  return (
    <List>
      {pages && pages.map((page, index) => (
        <PageListItem workspace={workspace} page={page} key={index} setSelectedPage={() => setSelectedPage(page)}/>
      ))}
    </List>
  )
}

export default ({workspace, selectedPage, setSelectedPage, deletePage}) => {
  const {addPage} = useContext(WorkspaceContext);
  const classes = useStyles()
  return (
    <Drawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <div className={classes.toolbar}>
        <img src={logo} className={classes.logo} alt="logo"/>
      </div>
      {workspace && <PageNameList {...{workspace, selectedPage, setSelectedPage}}/>}
      <Button onClick={() => addPage()}>Add Page</Button>
      <LogInLogOutButton/>
    </Drawer>

  )
}

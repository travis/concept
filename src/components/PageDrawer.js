import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import { schema } from 'rdf-namespaces';

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

export default ({pages, setSelectedPageIndex, addPage, deletePage}) => {
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
      <List>
        {pages && pages.map((page, index) => (
          <ListItem button key={index} onClick={() => setSelectedPageIndex(index)}>
            <ListItemText primary={page.getString(schema.name)} />
            <Button onClick={() => deletePage(page.asRef())}>Delete</Button>
          </ListItem>
        ))}
      </List>
      <Button onClick={() => addPage()}>Add Page</Button>
      <LogInLogOutButton/>
    </Drawer>

  )
}

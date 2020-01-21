import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import { schema } from 'rdf-namespaces';

import LogInLogOutButton from './LogInLogOutButton';

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
      <div className={classes.toolbar} />
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

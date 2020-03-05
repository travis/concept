import React from 'react';
import MUIIconButton from '@material-ui/core/IconButton';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  active: {
    background: theme.palette.grey[300]
  },
  inactive: {

  }
}))

export default function IconButton({active, ...props}){
  const classes = useStyles();
  return (<MUIIconButton className={active ? classes.active : classes.inactive} {...props}/>);
}

import React from 'react';
import MUIIconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  active: {
    background: theme.palette.grey[300]
  },
  inactive: {

  }
}))

export default function IconButton({active, title, ariaLabel,...props}){
  const classes = useStyles();
  const button = (
    <MUIIconButton className={active ? classes.active : classes.inactive}
                   aria-label={ariaLabel || title}
                   {...props}/>
  )
  return title ? (
    <Tooltip title={title} aria-label={ariaLabel || title}>
      {button}
    </Tooltip>
  ) : button
}

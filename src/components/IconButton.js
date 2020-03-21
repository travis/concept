import React, { forwardRef } from 'react';
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

const IconButton = forwardRef(({active, title, ariaLabel,...props}, ref) => {
  const classes = useStyles();
  const button = (
    <MUIIconButton className={active ? classes.active : classes.inactive}
                   aria-label={ariaLabel || title}
                   ref={ref}
                   {...props}/>
  )
  return title ? (
    <Tooltip title={title} aria-label={ariaLabel || title}>
      {button}
    </Tooltip>
  ) : button
})

export default IconButton

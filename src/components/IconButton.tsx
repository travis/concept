import React, { forwardRef, Ref } from 'react';
import IconButton, { IconButtonProps } from '@material-ui/core/IconButton';

import Tooltip from '@material-ui/core/Tooltip';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  active: {
    background: theme.palette.grey[300]
  },
  inactive: {

  }
}))

interface Props extends IconButtonProps {
  active?: boolean,
  title?: string,
  ariaLabel?: string
}

const MyIconButton = forwardRef(({ active, title, ariaLabel, ...props }: Props, ref: Ref<HTMLButtonElement>) => {
  const classes = useStyles();
  const button = (
    <IconButton className={active ? classes.active : classes.inactive}
      aria-label={ariaLabel || title}
      ref={ref}
      {...props} />
  )
  return title ? (
    <Tooltip title={title} aria-label={ariaLabel || title}>
      {button}
    </Tooltip>
  ) : button
})

export default MyIconButton

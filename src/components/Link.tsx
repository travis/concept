import React from 'react'
import { Link as RouterLink } from "react-router-dom";
import MuiLink from '@material-ui/core/Link';

const Link = (props: any) => {
  if (props.href) {
    return <MuiLink {...props} />
  } else {
    return <MuiLink component={RouterLink} {...props} />
  }
}

export default Link

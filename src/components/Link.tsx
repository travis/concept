import React, { FunctionComponent, forwardRef, Ref } from 'react'
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import MuiLink, { LinkProps as MuiLinkProps } from '@material-ui/core/Link';

type Partial<T> = {
  [P in keyof T]?: T[P];
}

export type LinkProps = MuiLinkProps & Partial<RouterLinkProps>

const Link: FunctionComponent<LinkProps> = forwardRef((props, ref: Ref<HTMLAnchorElement>) => {
  if (props.href) {
    return <MuiLink ref={ref} {...props} />
  } else {
    return <MuiLink ref={ref} component={RouterLink} {...props} />
  }
})

export default Link

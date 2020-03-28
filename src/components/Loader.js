import React from 'react'

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
import Loader from 'react-loader-spinner'
import { useTheme } from '@material-ui/core/styles';

export default ({display, height, width, ...props}) => {
  const theme = useTheme();
  return (
    <Loader
      type="Triangle" color={theme.palette.info.light}
      height={theme.spacing(height || 10)}
      width={theme.spacing(width || 10)}
      {...props}/>
  )
}

import React from 'react'

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
import Loader from 'react-loader-spinner'
import { useTheme } from '@material-ui/core/styles';

export default (props) => {
  const theme = useTheme();
  return (
    <Loader
      type="MutatingDots" color={theme.palette.info.light} height={80} width={80}
      {...props}/>
  )
}

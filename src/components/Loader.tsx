import React from 'react';

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
import Loader from 'react-loader-spinner'
import { useTheme } from '@material-ui/core/styles';

type Types = 'Triangle' | 'ThreeDots'

export default ({ height, width, type = "Triangle", ...props }: { height?: number, width: number, type?: Types }) => {
  const theme = useTheme();
  return (
    <Loader
      type={type} color={theme.palette.info.light}
      height={theme.spacing(height || 10)}
      width={theme.spacing(width || 10)}
      {...props} />
  )
}

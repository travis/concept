import React, { PropsWithChildren } from 'react';

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
import Loader from 'react-loader-spinner'
import { useTheme } from '@material-ui/core/styles';

type Types = 'Triangle' | 'ThreeDots'

type Props = { height?: number, width?: number, type?: Types, className?: string }

const ConceptLoader = ({ height, width, type = "Triangle", ...props }: PropsWithChildren<Props>) => {
  const theme = useTheme();
  return (
    <Loader
      type={type} color={theme.palette.info.light}
      height={theme.spacing(height || 10)}
      width={theme.spacing(width || 10)}
      {...props} />
  )
}

export const ButtonLoader = () => <ConceptLoader type="ThreeDots" width={3} height={1} />
export const BlockLoader = () => <ConceptLoader type="ThreeDots" width={5} height={2} />

export default ConceptLoader;

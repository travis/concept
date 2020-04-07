import React, { FunctionComponent } from 'react'

import { useEditor } from 'slate-react';

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import ArrowRight from '@material-ui/icons/ArrowRight';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import ArrowLeft from '@material-ui/icons/ArrowLeft';
import ArrowUp from '@material-ui/icons/ArrowDropUp';

import {
  insertRow, insertColumn, removeRow, removeColumn,
} from '../../utils/editor';

import { ElementProps } from "./"
import IconButton from '../IconButton';
import { useStyles as useBlockStyles } from './Block'

const useStyles = makeStyles(theme => ({
  table: {
    border: "1px solid black",
    borderCollapse: "collapse"
  },
  tr: {
  },
  td: {
    border: `2px solid ${theme.palette.grey[300]}`,
    padding: theme.spacing(1)
  },
  columnButtons: {
    display: "flex",
    flexDirection: "column",
    verticalAlign: "top"
  },
  rowButtons: {
    display: "flex"
  },
}))



const Table: FunctionComponent<ElementProps> = ({ attributes, children, element }) => {
  const editor = useEditor()
  const classes = useStyles()
  const blockClasses = useBlockStyles()
  return (
    <>
      <Box display="flex">
        <table className={classes.table}>
          <tbody {...attributes}>{children}</tbody>
        </table>
        <Box className={`${classes.columnButtons} ${blockClasses.blockHoverButtons}`}
          contentEditable={false}>
          <IconButton title="add column" size="small"
            onClick={() => insertColumn(editor, element)}>
            <ArrowRight />
          </IconButton>
          <IconButton title="remove column" size="small"
            onClick={() => removeColumn(editor, element)}>
            <ArrowLeft />
          </IconButton>
        </Box>
      </Box>
      <Box className={`${classes.rowButtons} ${blockClasses.blockHoverButtons}`} contentEditable={false}>
        <IconButton title="add row" size="small"
          onClick={() => insertRow(editor, element)}>
          <ArrowDown />
        </IconButton>
        <IconButton title="remove row" size="small"
          onClick={() => removeRow(editor, element)}>
          <ArrowUp />
        </IconButton>
      </Box>
    </>
  )
}
export default Table

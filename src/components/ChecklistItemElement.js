import React from 'react';

import {
  useEditor, useReadOnly, ReactEditor
} from 'slate-react';
import { Transforms } from 'slate';
import Checkbox from '@material-ui/core/Checkbox';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    "& + &": {
      marginTop: 0
    }
  },
  checkbox: {
    padding: theme.spacing(0.5),
    marginRight: theme.spacing(0.5)
  },
  text: {
    flex: 1,
    opacity: ({checked}) => checked ? 0.666 : 1,
    textDecoration: ({checked}) => checked ? 'line-through' : 'none',
    "&:focus": {
      outline: "none"
    }
  }
}))

export default function CheckListItemElement({ attributes, children, element }) {
  const editor = useEditor()
  const readOnly = useReadOnly()
  const { checked } = element
  const classes = useStyles({checked})
  return (
    <div
      {...attributes}
      className={classes.container}
    >
      <Checkbox
        contentEditable={false}
        checked={!!checked}
        color="default"
        size="small"
        classes={{root: classes.checkbox}}
        onChange={event => {
          const path = ReactEditor.findPath(editor, element)
          Transforms.setNodes(
            editor,
            { checked: event.target.checked },
            { at: path }
          )
        }}
      />
      <span
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className={classes.text}
      >
        {children}
      </span>
    </div>
  )
}

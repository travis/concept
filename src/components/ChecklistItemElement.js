import React from 'react';

import {
  useEditor, useReadOnly, ReactEditor
} from 'slate-react';
import { Transforms } from 'slate';
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
    marginRight: "0.75em"
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
      <span
        contentEditable={false}
        className={classes.checkbox}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={event => {
            const path = ReactEditor.findPath(editor, element)
            Transforms.setNodes(
              editor,
              { checked: event.target.checked },
              { at: path }
            )
          }}
        />
      </span>
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

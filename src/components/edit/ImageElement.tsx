import React, { useRef, useState, FunctionComponent } from 'react'
import { Transforms } from 'slate';
import { useSelected, useFocused, useEditor, ReactEditor } from 'slate-react';

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import EditIcon from '@material-ui/icons/Edit';
import ArrowRight from '@material-ui/icons/ArrowRight';

import { ImageEditor } from '../ImageUploader';

import { ElementProps } from "./"
import { useStyles as useBlockStyles } from "./Block"

const useStyles = makeStyles(theme => ({
  image: {
    display: "block",
    width: ({ width }: { width?: number }) => width || theme.spacing(20),
    height: "auto",
    boxShadow: ({ selected, focused }: { selected?: boolean, focused?: boolean }) =>
      selected && focused ? '0 0 0 3px #B4D5FF' : 'none'
  },
  editImageIcon: {
    cursor: "pointer"
  },
  imageWidthDragHandle: {
    width: theme.spacing(3),
    cursor: "ew-resize",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  }
}))

const ImageElement: FunctionComponent<ElementProps> = ({ attributes, children, element }) => {
  const editor = useEditor()
  const image = useRef<HTMLImageElement>(null)
  const [editing, setEditing] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragStartImageWidth, setDragStartImageWidth] = useState<number | null>(null)
  const selected = useSelected()
  const focused = useFocused()
  const width = element.width;
  const classes = useStyles({ selected, focused, width })
  const blockClasses = useBlockStyles()
  const path = ReactEditor.findPath(editor, element)
  return (
    <div {...attributes}>
      <Box contentEditable={false} display="flex">
        <img ref={image}
          alt={element.alt || ""}
          src={element.url}
          className={classes.image}
        />
        <Box flexShrink={0}
          display="flex"
          flexDirection="column"
          className={blockClasses.blockHoverButtons}>
          <EditIcon fontSize="small"
            className={classes.editImageIcon}
            onClick={() => setEditing(true)} />
          <Box className={classes.imageWidthDragHandle}
            flexGrow={1}
            draggable={true}
            onDragStart={e => {
              Transforms.select(editor, path)
              setDragStartImageWidth(image && image.current && image.current.clientWidth)
              setDragStart(e.clientX)
            }}
            onDrag={e => {
              if (dragStartImageWidth && dragStart) {
                const newWidth = dragStartImageWidth + (e.clientX - dragStart)
                if (width !== newWidth) {
                  Transforms.setNodes(editor, { width: newWidth }, { at: path })
                }
              }
            }}>
            <ArrowRight />
          </Box>
        </Box>
      </Box>
      {children}
      <ImageEditor open={editing} element={element}
        onClose={() => setEditing(false)}
        onSave={(savedUrl: string) => {
          const u = new URL(savedUrl)
          u.searchParams.set("updated", Date.now().toString())
          Transforms.setNodes(editor, { url: u.toString() }, { at: path })
          setEditing(false)
        }} />
    </div>
  )
}

export default ImageElement

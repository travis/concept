import React, { FunctionComponent, ReactNode, useRef, useState } from 'react'
import { Element, Transforms } from 'slate';
import { useEditor, useReadOnly, ReactEditor } from 'slate-react';
import { useDrag, useDrop } from 'react-dnd'

import { makeStyles } from '@material-ui/core/styles';
import Menu, { MenuProps } from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import AddIcon from '@material-ui/icons/Add';
import DragIcon from '@material-ui/icons/DragIndicator';

import IconButton from '../IconButton';
import InsertMenu from './InsertMenu'
import TurnIntoMenu from './TurnIntoMenu'

export const useStyles = makeStyles(theme => ({
  dragButton: {
    cursor: ({ isDragging }: { isDragging?: boolean }) => isDragging ? "move" : "grab"
  },
  block: {
    position: "relative",
    "&:hover $blockHoverButtons": {
      visibility: "visible"
    },
    left: -theme.spacing(7),
    paddingLeft: theme.spacing(7),
    borderBottomWidth: theme.spacing(0.5),
    borderBottomStyle: "solid",
    borderBottomColor: "transparent"
  },
  blockHoverButtons: {
    visibility: ({ menuOpen }: { menuOpen?: boolean }) => menuOpen ? "visible" : "hidden",
    opacity: 0.5,
  },
  blockContent: {
    borderBottomWidth: theme.spacing(0.5),
    borderBottomStyle: "solid",
    borderBottomColor: ({ isOver }: { isOver?: boolean }) => isOver ? theme.palette.info.light : "transparent"
  },
  blockButtons: {
    position: "absolute",
    left: -theme.spacing(0),
    "& button": {
      padding: 0
    }
  },
}))

type BlockMenuProps = MenuProps & { element: Element, onClose: () => void }

const BlockMenu: FunctionComponent<BlockMenuProps> = ({ element, onClose, ...props }) => {
  const editor = useEditor()
  const turnIntoRef = useRef(null)
  const [turnIntoMenuOpen, setTurnIntoMenuOpen] = useState(false)
  return (
    <>
      <Menu
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        onClose={() => {
          setTurnIntoMenuOpen(false)
          onClose()
        }}
        {...props}>
        <MenuItem onClick={() => {
          Transforms.removeNodes(editor, {
            at: ReactEditor.findPath(editor, element)
          })
        }}>
          delete
        </MenuItem>
        <MenuItem ref={turnIntoRef}
          onMouseEnter={() => setTurnIntoMenuOpen(true)}
          onMouseLeave={() => setTurnIntoMenuOpen(false)}
        >
          turn into ⩺
        </MenuItem>
      </Menu>
      {turnIntoMenuOpen && (
        <TurnIntoMenu element={element}
          onMouseEnter={() => setTurnIntoMenuOpen(true)}
          anchorEl={turnIntoRef.current}
          open={turnIntoMenuOpen} onClose={() => {
            setTurnIntoMenuOpen(false)
            onClose()
          }} />
      )}
    </>
  )
}

type BlockProps = {
  children: ReactNode,
  element: Element
}

const Block: FunctionComponent<BlockProps> = ({ children, element }) => {
  const editor = useEditor()
  const readOnly = useReadOnly()
  const buttonsRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const insertRef = useRef(null)
  const [insertMenuOpen, setInsertMenuOpen] = useState(false)
  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: "block", element },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    })
  })
  const [{ isOver }, drop] = useDrop({
    accept: "block",
    drop: (item: any) => {
      const sourcePath = ReactEditor.findPath(editor, item.element)
      const sourceIndex = sourcePath[sourcePath.length - 1]
      const targetPath = ReactEditor.findPath(editor, element)
      const targetIndex = targetPath[targetPath.length - 1]
      if (sourceIndex !== targetIndex) {
        const insertIndex = sourceIndex > targetIndex ? targetIndex + 1 : targetIndex
        Transforms.moveNodes(editor, {
          at: sourcePath,
          to: [...targetPath.slice(0, -1), insertIndex]
        })
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
    }),
  })

  const classes = useStyles({ menuOpen, isDragging, isOver })

  return (
    <div className={classes.block} ref={drop}>
      {!readOnly && (
        <>
          <BlockMenu element={element} anchorEl={buttonsRef.current}
            open={menuOpen}
            onClose={() => setMenuOpen(false)} />
          <InsertMenu element={element} anchorEl={insertRef.current}
            open={insertMenuOpen}
            onClose={() => {
              setInsertMenuOpen(false)
            }}
            onExiting={() => {
              ReactEditor.focus(editor)
            }} />
          <div contentEditable={false} className={`${classes.blockButtons} ${classes.blockHoverButtons}`} ref={buttonsRef}>
            <IconButton ref={insertRef}
              size="small" onClick={() => setInsertMenuOpen(!insertMenuOpen)}
              title="insert">
              <AddIcon></AddIcon>
            </IconButton>
            <IconButton ref={drag}
              size="small" onClick={() => setMenuOpen(!menuOpen)} className={classes.dragButton}
              title="">
              <DragIcon></DragIcon>
            </IconButton>
          </div>
        </>
      )}
      <div ref={preview} className={classes.blockContent}>
        {children}
      </div>
    </div>
  )
}

export default Block

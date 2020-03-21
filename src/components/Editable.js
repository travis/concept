import React, { useCallback, useMemo, useRef, useState, forwardRef } from 'react';
import { Link } from "react-router-dom";
import {
  Editable as SlateEditable, useSelected, useFocused, useEditor, withReact, useSlate,
  ReactEditor
} from 'slate-react';
import isHotkey from 'is-hotkey';

import { makeStyles } from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';
import Box from '@material-ui/core/Box';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import UnlinkIcon from '@material-ui/icons/LinkOff';
import AddIcon from '@material-ui/icons/Add';
import DragIcon from '@material-ui/icons/DragIndicator';

import { createEditor, Transforms } from 'slate';
import { withHistory } from 'slate-history'

import { withImages, withLinks, withChecklists, withLists, toggleMark, makeBlock, insertBlock, insertImage } from '../utils/editor';

import ChecklistItemElement from './ChecklistItemElement'
import IconButton from './IconButton';
import { removeLink } from '../utils/editor'

const useStyles = makeStyles(theme => ({
  image: {
    display: "block",
    maxWidth: "100%",
    maxHeight: theme.spacing(20),
    boxShadow: ({selected, focused}) => selected && focused ? '0 0 0 3px #B4D5FF' : 'none'
  },
  blockquote: {
    backgroundColor: theme.palette.grey[100],
    marginLeft: theme.spacing(1),
    marginTop: 0,
    marginRight: theme.spacing(1),
    marginBottom: 0,
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(1)
  },
  orderedList: {
    paddingLeft: theme.spacing(3)
  },
  unorderedList: {
    paddingLeft: theme.spacing(3)
  },
  aPopover: {
    padding: theme.spacing(1)
  },
  unlinkButton: {
    padding: 0,
    marginLeft: theme.spacing(1)
  },
  block: {
    position: "relative",
    "&:hover $blockButtons": {
      visibility: "visible"
    },
    left: -theme.spacing(7),
    paddingLeft: theme.spacing(7)
  },
  blockButtons: {
    visibility: ({menuOpen}) => menuOpen ? "visible" : "hidden",
    position: "absolute",
    left: -theme.spacing(0),
    opacity: 0.5,
    "& button": {
      padding: 0
    }
  },
  paragraph: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  turnIntoMenu: {
    pointerEvents: "none"
  },
  turnIntoMenuPaper: {
    pointerEvents: "auto"
  }
}))

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

const ImageElement = ({ attributes, children, element }) => {
  const selected = useSelected()
  const focused = useFocused()
  const classes = useStyles({selected, focused})
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <img
          alt=""
          src={element.url}
          className={classes.image}
        />
      </div>
      {children}
    </div>
  )
}

const LinkElement = ({attributes, children, element}) => {
  const editor = useEditor()
  const selected = useSelected()
  const classes = useStyles()
  const aRef = useRef()
  return (
    <>
      <a {...attributes} href={element.url} ref={aRef}>
        {children}
      </a>
      {true && (
        <Popover open={selected}
                 anchorEl={aRef.current} disableAutoFocus disableEnforceFocus
                 anchorOrigin={{
                   vertical: 'bottom',
                   horizontal: 'center',
                 }}
                 transformOrigin={{
                   vertical: 'top',
                   horizontal: 'center',
                 }}
                 PaperProps={{className: classes.aPopover}}>
          <Link to={element.url}>{element.url}</Link>
          <IconButton variant="small" onClick={() => removeLink(editor)}
                      className={classes.unlinkButton}>
            <UnlinkIcon></UnlinkIcon>
          </IconButton>
        </Popover>
      )}
    </>
  )
}

const TurnIntoItem = forwardRef(({element, format, onClose, ...props}, ref) => {
  const editor = useSlate()
  const onClick = useCallback(() => {
    makeBlock(editor, format, ReactEditor.findPath(editor, element))
    onClose()
  }, [editor, format, element, onClose])
  return (
    <MenuItem onClick={onClick} ref={ref} {...props}/>
  )
})

function TurnIntoMenu({element, onClose, ...props}){
  const classes = useStyles()
  return (
    <Menu className={classes.turnIntoMenu}
          classes={{
            paper: classes.turnIntoMenuPaper
          }}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'center',
            horizontal: 'left',
          }}
          onClose={onClose}
          {...props}>
      <TurnIntoItem element={element} format="p" onClose={onClose}>
        text
        </TurnIntoItem>
      <TurnIntoItem element={element} format="heading-one" onClose={onClose}>
        heading 1
      </TurnIntoItem>
      <TurnIntoItem element={element} format="heading-two" onClose={onClose}>
        heading 2
        </TurnIntoItem>
      <TurnIntoItem element={element} format="heading-three" onClose={onClose}>
        heading 3
      </TurnIntoItem>
      <TurnIntoItem element={element} format="block-quote" onClose={onClose}>
        quote
      </TurnIntoItem>
      <TurnIntoItem element={element} format="numbered-list" onClose={onClose}>
        numbered list
      </TurnIntoItem>
      <TurnIntoItem element={element} format="bulleted-list" onClose={onClose}>
        bulleted list
      </TurnIntoItem>
      <TurnIntoItem element={element} format="check-list-item" onClose={onClose}>
        todo list
        </TurnIntoItem>
    </Menu>)
}

const insertionPoint = (editor, element) => {
  const [first, ...rest] = ReactEditor.findPath(editor, element)
  return (
    [first + 1, ...rest]
  )
}

const InsertItem = forwardRef(({element, format, onClose, ...props}, ref) => {
  const editor = useSlate()
  const onClick = useCallback(() => {
    const insertAt = insertionPoint(editor, element)
    insertBlock(editor, format, insertAt)
    Transforms.select(editor, insertAt)
    onClose()
  }, [editor, format, element, onClose])
  return (
    <MenuItem onClick={onClick} ref={ref} {...props}/>
  )
})

const InsertImageItem = forwardRef(({element, onClose, ...props}, ref) => {
  const editor = useSlate()
  return (
    <MenuItem
      onClick={event => {
        event.preventDefault()
        const url = window.prompt('Enter the URL of the image:')
        if (!url) return
        const insertAt = insertionPoint(editor, element)
        insertImage(editor, url, insertAt)
        Transforms.select(editor, insertAt)
        onClose()
      }}
    {...props}
    />
  )
})

function InsertMenu({element, onClose, ...props}){
  const classes = useStyles()
  return (
    <Menu className={classes.insertMenu}
          classes={{
            paper: classes.insertMenuPaper
          }}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'center',
            horizontal: 'left',
          }}
          onClose={onClose}
          {...props}>
      <InsertItem element={element} format="p" onClose={onClose}>
        text
      </InsertItem>
      <InsertItem element={element} format="heading-one" onClose={onClose}>
        heading 1
      </InsertItem>
      <InsertItem element={element} format="heading-two" onClose={onClose}>
        heading 2
        </InsertItem>
      <InsertItem element={element} format="heading-three" onClose={onClose}>
        heading 3
      </InsertItem>
      <InsertItem element={element} format="block-quote" onClose={onClose}>
        quote
      </InsertItem>
      <InsertItem element={element} format="numbered-list" onClose={onClose}>
        numbered list
      </InsertItem>
      <InsertItem element={element} format="bulleted-list" onClose={onClose}>
        bulleted list
      </InsertItem>
      <InsertItem element={element} format="check-list-item" onClose={onClose}>
        todo list
      </InsertItem>
      <InsertImageItem element={element} onClose={onClose}>
        image
      </InsertImageItem>
    </Menu>)
}

function BlockMenu({element, onClose, ...props}) {
  const editor = useSlate()
  const turnIntoRef = useRef()
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
        <MenuItem onClick={() => {Transforms.removeNodes(editor, {
          at: ReactEditor.findPath(editor, element)
        })}}>
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
                      }}/>
      )}
    </>
  )
}

function Block({children, element}) {
  const editor = useSlate()
  const buttonsRef = useRef()
  const [menuOpen, setMenuOpen] = useState(false)
  const insertRef = useRef()
  const [insertMenuOpen, setInsertMenuOpen] = useState(false)
  const classes = useStyles({menuOpen})
  return (
    <Box className={classes.block}>
      <BlockMenu element={element} anchorEl={buttonsRef.current}
                 open={menuOpen}
                 onClose={() => setMenuOpen(false)}/>
      <InsertMenu element={element} anchorEl={insertRef.current}
                  open={insertMenuOpen}
                  onClose={() => {
                    setInsertMenuOpen(false)
                  }}
                  onExiting={() => {
                    ReactEditor.focus(editor)
                  }}/>
      <Box contentEditable={false} className={classes.blockButtons} ref={buttonsRef}>
        <IconButton variant="small" onClick={() => setInsertMenuOpen(!insertMenuOpen)} ref={insertRef}
                    title="Insert">
          <AddIcon></AddIcon>
        </IconButton>
        <IconButton variant="small" onClick={() => setMenuOpen(!menuOpen)}
                    title="">
          <DragIcon></DragIcon>
        </IconButton>
      </Box>
      {children}
    </Box>
  )
}

const Element = (props) => {
  const { attributes, children, element } = props;
  const classes = useStyles()
  switch (element.type) {
  case 'block-quote':
    return <Block element={element}><blockquote className={classes.blockquote} {...attributes}>{children}</blockquote></Block>
  case 'heading-one':
    return <Block element={element}><h1 {...attributes}>{children}</h1></Block>
  case 'heading-two':
    return <Block element={element}><h2 {...attributes}>{children}</h2></Block>
  case 'heading-three':
    return <Block element={element}><h3 {...attributes}>{children}</h3></Block>
  case 'bulleted-list':
    return <Block element={element}><ul className={classes.unorderedList} {...attributes}>{children}</ul></Block>
  case 'numbered-list':
    return <Block element={element}><ol className={classes.orderedList} {...attributes}>{children}</ol></Block>
  case 'list-item':
    return <li {...attributes}>{children}</li>
  case 'image':
    return <Block element={element}><ImageElement {...props} /></Block>
  case 'link':
    return <LinkElement {...props}/>
  case 'check-list-item':
    return <Block element={element}><ChecklistItemElement {...props} /></Block>
  default:
    return <Block element={element}><p {...attributes} className={classes.paragraph}>{children}</p></Block>
  }
}

export const useNewEditor = () => useMemo(() => withLists(withChecklists(withLinks(withImages(withReact(withHistory(createEditor())))))), [])

export default function Editable({editor, ...props}){
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])
  const renderElement = useCallback(props => <Element {...props} />, [])
  return <SlateEditable
           renderLeaf={renderLeaf}
           renderElement={renderElement}
           spellCheck
           placeholder="What's your favorite concept..."
           onKeyDown={event => {
             for (const hotkey in HOTKEYS) {
               if (isHotkey(hotkey, event)) {
                 event.preventDefault()
                 const mark = HOTKEYS[hotkey]
                 toggleMark(editor, mark)
               }
             }
           }}
           {...props}/>
}

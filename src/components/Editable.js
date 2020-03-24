import React, {useCallback, useMemo, useRef, useState, forwardRef, useContext } from 'react';
import { createEditor, Transforms } from 'slate';
import {
  Editable as SlateEditable, useSelected, useFocused, useEditor, withReact,
  ReactEditor
} from 'slate-react';
import isHotkey from 'is-hotkey';
import { useDrag, useDrop } from 'react-dnd'

import { makeStyles } from '@material-ui/core/styles';
import Link from '@material-ui/core/Link';
import TextField from '@material-ui/core/TextField';
import Popover from '@material-ui/core/Popover';
import Box from '@material-ui/core/Box';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import UnlinkIcon from '@material-ui/icons/LinkOff';
import AddIcon from '@material-ui/icons/Add';
import DragIcon from '@material-ui/icons/DragIndicator';
import ArrowRight from '@material-ui/icons/ArrowRight';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import ArrowLeft from '@material-ui/icons/ArrowLeft';
import ArrowUp from '@material-ui/icons/ArrowDropUp';
import CopyIcon from '@material-ui/icons/FileCopy';
import EditIcon from '@material-ui/icons/Edit';
import SaveIcon from '@material-ui/icons/Save';

import { withHistory } from 'slate-history';
import copy from 'copy-to-clipboard';

import {
  withImages, withLinks, withChecklists, withLists, toggleMark,
  makeBlock, insertBlock, withTables,
  insertRow, insertColumn, removeRow, removeColumn,
  setLinkUrl, insertionPoint
} from '../utils/editor';

import PageContext from '../context/page'

import ChecklistItemElement from './ChecklistItemElement'
import IconButton from './IconButton';
import ImageUploader from './ImageUploader';
import { removeLink } from '../utils/editor'

const useStyles = makeStyles(theme => ({
  image: {
    display: "block",
    width: ({width}) => width || theme.spacing(20),
    height: "auto",
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
  linkPopupButton: {
    padding: 0,
    marginLeft: theme.spacing(1)
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
    borderBottomColor: "white"
  },
  blockContent: {
    borderBottomWidth: theme.spacing(0.5),
    borderBottomStyle: "solid",
    borderBottomColor: ({isOver}) => isOver ? theme.palette.info.light : theme.palette.background.paper
  },
  blockHoverButtons: {
    visibility: ({menuOpen}) => menuOpen ? "visible" : "hidden",
    opacity: 0.5,
  },
  blockButtons: {
    position: "absolute",
    left: -theme.spacing(0),
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
  },
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
  dragButton: {
    cursor: ({isDragging}) => isDragging ? "move" : "grab"
  },
  imageUploadPopover: {
    minWidth: theme.spacing(30),
    minHeight: theme.spacing(20)
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
  const editor = useEditor()
  const image = useRef()
  const [dragStart, setDragStart] = useState()
  const [dragStartImageWidth, setDragStartImageWidth] = useState()
  const selected = useSelected()
  const focused = useFocused()
  const width = element.width;
  const classes = useStyles({selected, focused, width})
  const path = ReactEditor.findPath(editor, element)
  return (
    <div {...attributes}>
      <Box contentEditable={false} display="flex">
        <img ref={image}
             alt={element.alt || ""}
             src={element.url}
             className={classes.image}
        />
        <Box className={`${classes.imageWidthDragHandle} ${classes.blockHoverButtons}`}
             draggable={true}
             flexShrink={0}
             onDragStart={e => {
               setDragStartImageWidth(image.current.clientWidth)
               setDragStart(e.clientX)
             }}
             onDrag={e => {
               if (dragStartImageWidth && dragStart){
                 const newWidth = dragStartImageWidth + (e.clientX - dragStart)
                 if (width !== newWidth){
                   Transforms.setNodes(editor, {width: newWidth}, {at: path})
                 }
               }
             }}>
          <ArrowRight/>
        </Box>
      </Box>
      {children}
    </div>
  )
}

const LinkPopover = ({element, editing, setEditing, onClose, ...props}) => {
  const editor = useEditor()
  const [selection, setSelection] = useState()
  const [editValue, setEditValue] = useState(element.url)
  const classes = useStyles()
  const editLink = () => {
    setSelection(editor.selection)
    setEditing(true)
  }
  const saveLink = () => {
    setLinkUrl(editor, element, editValue)
    onClose()
    setEditing(false)
    Transforms.select(editor, selection)
  }
  return (
    <Popover disableAutoFocus disableEnforceFocus
             anchorOrigin={{
               vertical: 'bottom',
               horizontal: 'center',
             }}
             transformOrigin={{
               vertical: 'top',
               horizontal: 'center',
             }}
             PaperProps={{className: classes.aPopover}}
             onClose={onClose}
             {...props}>
      {editing ? (
        <TextField autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                   onKeyDown={event => {
                     if (event.keyCode === 13){
                       event.preventDefault()
                       saveLink()
                     }
                   } }/>
      ) : (
        <Link href={element.url} target="_blank">{element.url}</Link>
      )}
      {editing ? (
        <IconButton size="small" className={classes.linkPopupButton} title="edit link"
                    onClick={saveLink}>
          <SaveIcon></SaveIcon>
        </IconButton>
      ) : (
        <IconButton size="small" className={classes.linkPopupButton} title="edit link"
                    onClick={editLink}>
          <EditIcon></EditIcon>
        </IconButton>
      )}
      <IconButton size="small" className={classes.linkPopupButton} title="unlink"
                  onClick={() => removeLink(editor)}>
        <UnlinkIcon></UnlinkIcon>
      </IconButton>
      <IconButton size="small" className={classes.linkPopupButton} title="copy link"
                  onClick={() => copy(element.url)}>
        <CopyIcon></CopyIcon>
      </IconButton>
    </Popover>
  )
}

const LinkElement = ({attributes, children, element}) => {
  const aRef = useRef()
  const [editingLink, setEditingLink] = useState(false)
  const selected = useSelected()
  const open = (editingLink || selected)
  return (
    <>
      <Link {...attributes} href={element.url} ref={aRef}>
        {children}
      </Link>
      <LinkPopover element={element} open={open} anchorEl={aRef.current}
                   onClose={() => {
                     setEditingLink(false)
                   }}
                   editing={editingLink} setEditing={setEditingLink} />
    </>
  )
}

const TurnIntoItem = forwardRef(({element, format, onClose, ...props}, ref) => {
  const editor = useEditor()
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

const InsertItem = forwardRef(({element, format, onClose, ...props}, ref) => {
  const editor = useEditor()
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
  const classes = useStyles()
  const page = useContext(PageContext)
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  return (
    <>
      <MenuItem onClick={() => setImagePickerOpen(true)}
                {...props}/>
      <ImageUploader element={element}
                     onClose={onClose}
                     open={imagePickerOpen}
                     uploadDirectory={`${page.split(".").slice(0, -1).join(".")}/images/`}
                     classes={{paper: classes.imageUploadPopover}}/>
    </>
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
      <InsertItem element={element} format="table" onClose={onClose}>
        table
      </InsertItem>
    </Menu>)
}

function BlockMenu({element, onClose, ...props}) {
  const editor = useEditor()
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
  const editor = useEditor()
  const buttonsRef = useRef()
  const [menuOpen, setMenuOpen] = useState(false)
  const insertRef = useRef()
  const [insertMenuOpen, setInsertMenuOpen] = useState(false)
  const [{isDragging}, drag, preview] = useDrag({
    item: { type: "block", element },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    })
  })
  const [{ isOver }, drop] = useDrop({
    accept: "block",
    drop: (item) => {
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

  const classes = useStyles({menuOpen, isDragging, isOver})
  return (
    <Box className={classes.block} ref={drop}>
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
      <Box contentEditable={false} className={`${classes.blockButtons} ${classes.blockHoverButtons}`} ref={buttonsRef}>
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
      </Box>
      <Box ref={preview} className={classes.blockContent}>
        {children}
      </Box>
    </Box>
  )
}

const Table = ({attributes, children, element}) => {
  const editor = useEditor()
  const classes = useStyles()
  return (
    <>
      <Box display="flex">
        <table className={classes.table}>
          <tbody {...attributes}>{children}</tbody>
        </table>
        <Box className={`${classes.columnButtons} ${classes.blockHoverButtons}`}
             contentEditable={false}>
          <IconButton title="add column" size="small"
                      onClick={() => insertColumn(editor, element)}>
            <ArrowRight/>
          </IconButton>
          <IconButton title="remove column" size="small"
                      onClick={() => removeColumn(editor, element)}>
            <ArrowLeft/>
          </IconButton>
        </Box>
      </Box>
      <Box className={`${classes.rowButtons} ${classes.blockHoverButtons}`} contentEditable={false}>
        <IconButton title="add row" size="small"
                    onClick={() => insertRow(editor, element)}>
          <ArrowDown/>
        </IconButton>
        <IconButton title="remove row" size="small"
                    onClick={() => removeRow(editor, element)}>
          <ArrowUp/>
        </IconButton>
      </Box>
    </>
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
  case 'table':
    return (
      <Block element={element}>
        <Table {...props}/>
      </Block>
    )
  case 'table-row':
    return <tr {...attributes}>{children}</tr>
  case 'table-cell':
    return <td className={classes.td} {...attributes}>{children}</td>
  default:
    return <Block element={element}><p {...attributes} className={classes.paragraph}>{children}</p></Block>
  }
}

export const useNewEditor = () => useMemo(() => withTables(withLists(withChecklists(withLinks(withImages(withReact(withHistory(createEditor()))))))), [])

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

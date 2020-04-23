import React, { useState, useRef, useEffect, useContext } from 'react';
import { ReactEditor, useSlate, useEditor } from 'slate-react';
import { Editor, Range, Transforms } from 'slate'

import { makeStyles, useTheme } from '@material-ui/core/styles';

import Toolbar from '@material-ui/core/Toolbar';
import TextField from '@material-ui/core/TextField';
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import FormatBold from '@material-ui/icons/FormatBold';
import FormatItalic from '@material-ui/icons/FormatItalic';
import FormatUnderlined from '@material-ui/icons/FormatUnderlined';
import Code from '@material-ui/icons/Code';
import FormatQuote from '@material-ui/icons/FormatQuote';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import FormatListNumbered from '@material-ui/icons/FormatListNumbered';
import ImageIcon from '@material-ui/icons/ImageOutlined';
import LinkIcon from '@material-ui/icons/Link';
import CheckBox from '@material-ui/icons/CheckBoxOutlined';
import ConceptIcon from '@material-ui/icons/Toll';

import IconButton from './IconButton';

import {
  isMarkActive, toggleMark, isBlockActive, toggleBlock, insertImage,
  isLinkActive, insertLink, isConceptActive, insertConcept
} from '../utils/editor'
import { conceptUri } from '../utils/urls'
import WorkspaceContext from '../context/workspace'

const useStyles = makeStyles(theme => ({
  toolbarRoot: {
    pointerEvents: "none"
  },
  toolbar: {
    pointerEvents: "auto"
  },
  insertLinkMenuRoot: {
    pointerEvents: "none"
  },
  insertLinkMenu: {
    pointerEvents: "auto"
  }
}))

const InsertImageButton = () => {
  const editor = useEditor()
  return (
    <IconButton
      title="Insert Image"
      size="small"
      onMouseDown={event => {
        event.preventDefault()
        const url = window.prompt('Enter the URL of the image:')
        if (!url) return
        insertImage(editor, url)
      }}
    >
      <ImageIcon/>
    </IconButton>
  )
}

const LinkButton = ({onOpen, onClose}) => {
  const editor = useSlate()
  const [linkButtonOpen, setLinkButtonOpen] = useState(false)
  const [url, setUrl] = useState(null)
  const [selection, setSelection] = useState(undefined)
  const ref = useRef()
  const onClosePopover = () => {
    setLinkButtonOpen(false)
    onClose()
  }
  const insertAndClose = () => {
    Transforms.select(editor, selection)
    insertLink(editor, url)
    onClosePopover()
  }
  return (
    <>
      <IconButton
        ref={ref}
        title="Insert Link"
        size="small"
        active={isLinkActive(editor)}
        onClick={() => {
          onOpen()
          setSelection(editor.selection)
          setLinkButtonOpen(!linkButtonOpen)
        }}
      >
        <LinkIcon/ >
      </IconButton>
      <Popover
        open={linkButtonOpen}
        onClose={onClosePopover}
        anchorEl={ref.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <TextField autoFocus placeholder="Paste your link here..."
                   size="small" variant="outlined"
                   value={url || ""}
                   onKeyDown={e => {
                     if (e.keyCode === 13) {
                       e.preventDefault()
                       insertAndClose()
                     }
                   }}
                   onChange={e => {
                     setUrl(e.target.value)
                   }}/>
        <Button onClick={() => {
          insertAndClose()
        }}>
          Link
        </Button>
      </Popover>
    </>
  )
}

const MarkButton = ({ format, icon, ...props }) => {
  const editor = useSlate()
  return (
    <IconButton
      size="small"
      active={isMarkActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
      {...props}
    >
      {icon}
    </IconButton>
  )
}

const selectedText = (editor) => {
  if (editor && editor.selection) {
    if (Range.isCollapsed(editor.selection)){
      return ""
    } else {
      return Editor.string(editor, editor.selection)
    }
  } else {
    return null
  }
}

const ConceptButton = ({onOpen, onClose}) => {
  const {workspace} = useContext(WorkspaceContext)
  const editor = useSlate()
  const [conceptButtonOpen, setConceptButtonOpen] = useState(false)
  const [name, setName] = useState(null)
  const [selection, setSelection] = useState(undefined)
  const ref = useRef()
  const onClosePopover = () => {
    setConceptButtonOpen(false)
    onClose()
  }
  const insertAndClose = () => {
    Transforms.select(editor, selection)
    insertConcept(editor, name, conceptUri(workspace.conceptContainerUri, name))
    onClosePopover()
  }
  return (
    <>
      <IconButton
        ref={ref}
        title="insert concept"
        size="small"
        active={isConceptActive(editor)}
        onClick={() => {
          onOpen()
          setSelection(editor.selection)
          setName(selectedText(editor))
          setConceptButtonOpen(!conceptButtonOpen)
        }}
      >
        <ConceptIcon/ >
      </IconButton>
      <Popover
        open={conceptButtonOpen}
        onClose={onClosePopover}
        anchorEl={ref.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <TextField autoFocus placeholder="Paste your link here..."
                   size="small" variant="outlined"
                   value={name || ""}
                   onKeyDown={e => {
                     if (e.keyCode === 13) {
                       e.preventDefault()
                       insertAndClose()
                     }
                   }}
                   onChange={e => setName(e.target.value)}/>
        <Button onClick={() => {
          insertAndClose()
        }}>
          insert
        </Button>
      </Popover>
    </>
  )
}

const BlockButton = ({ format, icon, ...props }) => {
  const editor = useSlate()
  return (
    <IconButton
      size="small"
      active={isBlockActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
      {...props}
    >
      {icon}
    </IconButton>
  )
}

export default function EditorToolbar(props){
  return (
    <Toolbar {...props}>
      <BlockButton title="Heading 1" format="heading-one" icon="H1" />
      <BlockButton title="Heading 2" format="heading-two" icon="H2" />
      <BlockButton title="Quote" format="block-quote" icon={<FormatQuote/>} />
      <BlockButton title="Numbered List" format="numbered-list" icon={<FormatListNumbered/>} />
      <BlockButton title="Bulleted List" format="bulleted-list" icon={<FormatListBulleted/>} />
      <InsertImageButton />
      <BlockButton title="Check List" format="check-list-item" icon={<CheckBox/>} />
    </Toolbar>
  )
}

export function HoveringToolbar() {
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const editor = useSlate()
  const open = submenuOpen || !!(editor.selection && !Range.isCollapsed(editor.selection))
  const theme = useTheme()
  const classes = useStyles()

  const [anchorPosition, setAnchorPosition] = useState({top: 0, left: 0})
  const onOpenSubmenu = () => {
    setSubmenuOpen(true)
  }
  const onCloseSubmenu = () => {
    setSubmenuOpen(false)
    setTimeout(() => {
      ReactEditor.focus(editor)
      const selection = editor.selection
      // manual focus seems to trigger a process that resets the selection, so reset it
      setTimeout(() => {
        Transforms.select(editor, selection)
        // this 200 second timeout here is wonky but seems to work
        // TODO: test on other platforms, figure out a better way to do this
        // this will probably be fixed by https://github.com/ianstormtaylor/slate/issues/3412
      }, 150)
    }, 0)
  }
  useEffect(() => {
    if (editor.selection){
      const domSelection = window.getSelection()
      const domRange = domSelection.getRangeAt(0)
      const rect = domRange.getBoundingClientRect()
      setAnchorPosition({top: rect.top - theme.spacing(1), left: rect.left})
    }
  }, [editor.selection, theme])
    return (
      <Popover
        disableAutoFocus disableEnforceFocus disableRestoreFocus hideBackdrop
        classes={{
          root: classes.toolbarRoot,
          paper: classes.toolbar
        }}
        open={!!open}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        >
        <MarkButton title="Bold" format="bold" icon={<FormatBold/>} />
        <MarkButton title="Italic" format="italic" icon={<FormatItalic/>} />
        <MarkButton title="Underline" format="underline" icon={<FormatUnderlined/>} />
        <MarkButton title="Code" format="code" icon={<Code/>} />
        <LinkButton onOpen={onOpenSubmenu} onClose={onCloseSubmenu} />
        <ConceptButton onOpen={onOpenSubmenu} onClose={onCloseSubmenu} />
      </Popover>
    )
}

import React from 'react';
import { useSlate, useEditor } from 'slate-react';
import { Range } from 'slate'

import { makeStyles, useTheme } from '@material-ui/core/styles';

import Toolbar from '@material-ui/core/Toolbar';
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
import Popover from '@material-ui/core/Popover';

import IconButton from './IconButton';

import {
  isMarkActive, toggleMark, isBlockActive, toggleBlock, insertImage,
  isLinkActive, insertLink
} from '../utils/editor'

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

const LinkButton = () => {
  const editor = useSlate()
  return (
    <IconButton
      title="Insert Link"
      size="small"
      active={isLinkActive(editor)}
      onMouseDown={event => {
        event.preventDefault()
        const url = window.prompt('Enter the URL of the link:')
        if (!url) return
        insertLink(editor, url)
      }}
    >
      <LinkIcon/ >
    </IconButton>
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

const useStyles = makeStyles(theme => ({
  toolbarRoot: {
    pointerEvents: "none"
  },
  toolbar: {
    pointerEvents: "auto"
  }
}))

export function HoveringToolbar() {
  const editor = useSlate()
  const open = editor.selection && !Range.isCollapsed(editor.selection)
  const theme = useTheme()
  const classes = useStyles()
  if (open) {

    const domSelection = window.getSelection()
    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()
    return (
      <Popover
        disableAutoFocus disableEnforceFocus disableRestoreFocus hideBackdrop
        classes={{
          root: classes.toolbarRoot,
          paper: classes.toolbar
        }}
        open={open}
        anchorReference="anchorPosition"
        anchorPosition={{top: rect.top - theme.spacing(1), left: rect.left}}
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
        <LinkButton />
      </Popover>
    )
  } else {
    return <></>
  }
}

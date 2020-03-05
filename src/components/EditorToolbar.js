import React from 'react';
import { useSlate, useEditor } from 'slate-react';

import Toolbar from '@material-ui/core/Toolbar';
import FormatBold from '@material-ui/icons/FormatBold';
import FormatItalic from '@material-ui/icons/FormatItalic';
import FormatUnderlined from '@material-ui/icons/FormatUnderlined';
import Code from '@material-ui/icons/Code';
import FormatQuote from '@material-ui/icons/FormatQuote';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import FormatListNumbered from '@material-ui/icons/FormatListNumbered';
import ImageIcon from '@material-ui/icons/Image';
import LinkIcon from '@material-ui/icons/Link';

import IconButton from './IconButton';

import {
  isMarkActive, toggleMark, isBlockActive, toggleBlock, insertImage,
  isLinkActive, insertLink
} from '../utils/editor'

const InsertImageButton = () => {
  const editor = useEditor()
  return (
    <IconButton
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

const MarkButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <IconButton
      size="small"
      active={isMarkActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      {icon}
    </IconButton>
  )
}

const BlockButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <IconButton
      size="small"
      active={isBlockActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      {icon}
    </IconButton>
  )
}

export default function EditorToolbar(props){
  return (
    <Toolbar {...props}>
      <MarkButton format="bold" icon={<FormatBold/>} />
      <MarkButton format="italic" icon={<FormatItalic/>} />
      <MarkButton format="underline" icon={<FormatUnderlined/>} />
      <MarkButton format="code" icon={<Code/>} />
      <BlockButton format="heading-one" icon="H1" />
      <BlockButton format="heading-two" icon="H2" />
      <BlockButton format="block-quote" icon={<FormatQuote/>} />
      <BlockButton format="numbered-list" icon={<FormatListNumbered/>} />
      <BlockButton format="bulleted-list" icon={<FormatListBulleted/>} />
      <InsertImageButton />
      <LinkButton />
    </Toolbar>
  )
}

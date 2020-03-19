import React, { useCallback, useMemo, useRef } from 'react';
import { Link } from "react-router-dom";
import {
  Editable as SlateEditable, useSelected, useFocused, useEditor
} from 'slate-react';
import isHotkey from 'is-hotkey';

import { makeStyles } from '@material-ui/core/styles';
import Portal from '@material-ui/core/Portal';
import Paper from '@material-ui/core/Paper';
import Popover from '@material-ui/core/Popover';
import UnlinkIcon from '@material-ui/icons/LinkOff';

import { createEditor, Node } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history'

import { withImages, withLinks, withChecklists, withLists, toggleMark } from '../utils/editor';

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
      )
      }
    </>
  )
}

const Element = (props) => {
  const { attributes, children, element } = props;
  const classes = useStyles()
  switch (element.type) {
  case 'block-quote':
    return <blockquote className={classes.blockquote} {...attributes}>{children}</blockquote>
  case 'bulleted-list':
    return <ul className={classes.unorderedList} {...attributes}>{children}</ul>
  case 'heading-one':
    return <h1 {...attributes}>{children}</h1>
  case 'heading-two':
    return <h2 {...attributes}>{children}</h2>
  case 'list-item':
    return <li {...attributes}>{children}</li>
  case 'numbered-list':
    return <ol className={classes.orderedList} {...attributes}>{children}</ol>
  case 'image':
    return <ImageElement {...props} />
  case 'link':
    return <LinkElement {...props}/>
  case 'check-list-item':
    return <ChecklistItemElement {...props} />
  default:
    return <p {...attributes}>{children}</p>
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

import React, { useState, useRef, FunctionComponent, ReactNode } from 'react'
import { Transforms, Range, Element } from 'slate';
import { useSelected, useEditor } from 'slate-react';

import copy from 'copy-to-clipboard';

import { makeStyles } from '@material-ui/core/styles';
import Link from '@material-ui/core/Link';
import TextField from '@material-ui/core/TextField';
import Popover, { PopoverProps } from '@material-ui/core/Popover';
import SaveIcon from '@material-ui/icons/Save';
import EditIcon from '@material-ui/icons/Edit';
import UnlinkIcon from '@material-ui/icons/LinkOff';
import CopyIcon from '@material-ui/icons/FileCopy';

import IconButton from '../IconButton';
import { setLinkUrl, removeLink } from '../../utils/editor';

const useStyles = makeStyles(theme => ({
  aPopover: {
    padding: theme.spacing(1)
  },
  linkPopupButton: {
    padding: 0,
    marginLeft: theme.spacing(1)
  },
}))

type LinkPopoverProps = {
  element: Element,
  editing: boolean,
  setEditing: (editing: boolean) => void,
  onClose: () => void
} & PopoverProps

const LinkPopover: FunctionComponent<LinkPopoverProps> = ({ element, editing, setEditing, onClose, ...props }) => {
  const editor = useEditor()
  const [selection, setSelection] = useState<Range | null>(null)
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
    selection && Transforms.select(editor, selection)
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
      PaperProps={{ className: classes.aPopover }}
      onClose={onClose}
      {...props}>
      {editing ? (
        <TextField autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
          onKeyDown={event => {
            if (event.keyCode === 13) {
              event.preventDefault()
              saveLink()
            }
          }} />
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

type LinkElementProps = {
  attributes: { [key: string]: any },
  element: Element,
  children: ReactNode
}

const LinkElement: FunctionComponent<LinkElementProps> = ({ attributes, children, element }) => {
  const aRef = useRef(null)
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

export default LinkElement

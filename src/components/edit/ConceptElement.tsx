import React, { useState, useRef, useContext, FunctionComponent } from 'react'
import { Transforms, Range, Element } from 'slate';
import { useSelected, useEditor } from 'slate-react';

import copy from 'copy-to-clipboard';

import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Popover, { PopoverProps } from '@material-ui/core/Popover';
import SaveIcon from '@material-ui/icons/Save';
import EditIcon from '@material-ui/icons/Edit';
import UnlinkIcon from '@material-ui/icons/LinkOff';
import CopyIcon from '@material-ui/icons/FileCopy';

import IconButton from '../IconButton';
import Link from '../Link';
import { setConceptProps, removeConcept } from '../../utils/editor';
import { ElementProps } from "./"
import { conceptPath, conceptUri, conceptUrl } from '../../utils/urls'
import WorkspaceContext from '../../context/workspace'

const useStyles = makeStyles(theme => ({
  aPopover: {
    padding: theme.spacing(1)
  },
  linkPopupButton: {
    padding: 0,
    marginLeft: theme.spacing(1)
  },
}))

type ConceptPopoverProps = {
  element: Element,
  editing: boolean,
  setEditing: (editing: boolean) => void,
  onClose: () => void
} & PopoverProps

const ConceptPopover: FunctionComponent<ConceptPopoverProps> = ({ element, editing, setEditing, onClose, ...props }) => {
  const { workspace } = useContext(WorkspaceContext)
  const editor = useEditor()
  const [selection, setSelection] = useState<Range | null>(null)
  const [editValue, setEditValue] = useState(element.name)
  const classes = useStyles()
  const editLink = () => {
    setSelection(editor.selection)
    setEditing(true)
  }
  const saveLink = () => {
    workspace && setConceptProps(editor, element, editValue, conceptUri(workspace.conceptContainerUri, editValue))
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
          <Link to={conceptPath(element.uri)}>{element.name}</Link>
        )}
      {editing ? (
        <IconButton size="small" className={classes.linkPopupButton} title="save"
          onClick={saveLink}>
          <SaveIcon></SaveIcon>
        </IconButton>
      ) : (
          <IconButton size="small" className={classes.linkPopupButton} title="change concept"
            onClick={editLink}>
            <EditIcon></EditIcon>
          </IconButton>
        )}
      <IconButton size="small" className={classes.linkPopupButton} title="unlink"
        onClick={() => removeConcept(editor)}>
        <UnlinkIcon></UnlinkIcon>
      </IconButton>
      <IconButton size="small" className={classes.linkPopupButton} title="copy link"
        onClick={() => copy(conceptUrl(element.uri))}>
        <CopyIcon></CopyIcon>
      </IconButton>
    </Popover>
  )
}

const ConceptElement: FunctionComponent<ElementProps> = ({ attributes, children, element }) => {
  const aRef = useRef(null)
  const [editingLink, setEditingLink] = useState(false)
  const selected = useSelected()
  const open = (editingLink || selected)
  return (
    <>
      <Link {...attributes} href={conceptPath(element.uri)} ref={aRef}>
        {children}
      </Link>
      <ConceptPopover element={element} open={open} anchorEl={aRef.current}
        onClose={() => {
          setEditingLink(false)
        }}
        editing={editingLink} setEditing={setEditingLink} />
    </>
  )
}

export default ConceptElement

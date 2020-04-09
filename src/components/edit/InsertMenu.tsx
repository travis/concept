import React, { useContext, useState, forwardRef, useCallback, Ref, FunctionComponent, PropsWithChildren } from 'react';
import { Transforms, Element } from 'slate';
import { useEditor } from 'slate-react';

import { makeStyles } from '@material-ui/core/styles';
import Menu, { MenuProps } from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import { insertBlock, insertionPoint } from '../../utils/editor';
import DocumentContext from '../../context/document'

import EmbedPicker from '../EmbedPicker'
import ImageUploader from '../ImageUploader'


const useStyles = makeStyles(theme => ({
  imageUploadPopover: {
    minWidth: theme.spacing(30),
    minHeight: theme.spacing(20)
  }
}))

type InsertItemProps = PropsWithChildren<{
  element: Element,
  format: string,
  onClose: () => void
}>

const InsertItem: FunctionComponent<InsertItemProps> = forwardRef(({ element, format, onClose, ...props }, ref: Ref<HTMLLIElement>) => {
  const editor = useEditor()
  const onClick = useCallback(async () => {
    const insertAt = insertionPoint(editor, element)
    insertBlock(editor, format, insertAt)
    Transforms.select(editor, insertAt)
    onClose()
  }, [editor, format, element, onClose])
  return (
    <MenuItem onClick={onClick} ref={ref} {...props} />
  )
})

type InsertImageItemProps = PropsWithChildren<{
  element: Element,
  onClose: () => void
}>

const InsertImageItem: FunctionComponent<InsertImageItemProps> = forwardRef(({ element, onClose, ...props }, ref: Ref<HTMLLIElement>) => {
  const classes = useStyles()
  const document = useContext(DocumentContext)
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  return (
    <>
      <MenuItem onClick={() => setImagePickerOpen(true)} ref={ref} {...props} />
      {document && (
        <ImageUploader element={element}
          onClose={onClose}
          open={imagePickerOpen}
          uploadDirectory={document.imageContainerUri}
          classes={{ paper: classes.imageUploadPopover }} />
      )}
    </>
  )
})

type InsertEmbedItemProps = PropsWithChildren<{
  element: Element,
  onClose: () => void
}>

const InsertEmbedItem: FunctionComponent<InsertEmbedItemProps> = forwardRef(({ element, onClose, ...props }, ref: Ref<HTMLLIElement>) => {
  const [embedPickerOpen, setEmbedPickerOpen] = useState(false)
  const editor = useEditor()

  const close = useCallback(() => {
    setEmbedPickerOpen(false)
    onClose()
  }, [onClose])
  const save = useCallback(async (embedUrl, embedType) => {
    const insertAt = insertionPoint(editor, element)
    insertBlock(editor, 'embed', insertAt, { url: embedUrl, embedType })
    Transforms.select(editor, insertAt)
    onClose()
  }, [editor, element, onClose])
  return (
    <>
      <MenuItem onClick={() => setEmbedPickerOpen(true)} ref={ref} {...props} />
      <EmbedPicker element={element}
        open={embedPickerOpen}
        onClose={close}
        onSave={save}
      />
    </>
  )
})

type InsertMenuProps = MenuProps & {
  element: Element,
  onClose: () => void
}

const InsertMenu: FunctionComponent<InsertMenuProps> = ({ element, onClose, ...props }) => {
  return (
    <Menu
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
      <InsertEmbedItem element={element} onClose={onClose}>
        embed
        </InsertEmbedItem>
    </Menu>)
}

export default InsertMenu

import React, { Ref, FunctionComponent, forwardRef, useCallback } from 'react';
import { Element } from 'slate';
import { useEditor, ReactEditor } from 'slate-react';

import { makeStyles } from '@material-ui/core/styles';
import Menu, { MenuProps } from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import { makeBlock } from '../../utils/editor';

const useStyles = makeStyles(theme => ({
  turnIntoMenu: {
    pointerEvents: "none"
  },
  turnIntoMenuPaper: {
    pointerEvents: "auto"
  },
}))

type TurnIntoItemProps = {
  element: Element,
  format: string,
  onClose: () => void
}

const TurnIntoItem: FunctionComponent<TurnIntoItemProps> = forwardRef(({ element, format, onClose, ...props }, ref: Ref<HTMLLIElement>) => {
  const editor = useEditor()
  const onClick = useCallback(() => {
    makeBlock(editor, format, ReactEditor.findPath(editor, element))
    onClose()
  }, [editor, format, element, onClose])
  return (
    <MenuItem onClick={onClick} ref={ref} {...props} />
  )
})

type TurnIntoMenuProps = MenuProps & {
  element: Element,
  onClose: () => void
}

const TurnIntoMenu: FunctionComponent<TurnIntoMenuProps> = ({ element, onClose, ...props }) => {
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
      <TurnIntoItem element={element} format="paragraph" onClose={onClose}>
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

export default TurnIntoMenu

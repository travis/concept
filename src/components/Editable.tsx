import React, { useCallback, useMemo, ReactNode, FunctionComponent } from 'react';
import { createEditor, Text, Editor } from 'slate';
import { Editable as SlateEditable, withReact } from 'slate-react';
import isHotkey from 'is-hotkey';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';

import { withHistory } from 'slate-history';

import {
  withImages, withLinks, withChecklists, withLists, toggleMark,
  withTables, withEmbeds, withConcepts
} from '../utils/editor';

import ChecklistItemElement from './ChecklistItemElement'
import EmbedElement from './EmbedElement'
import LinkElement from './edit/LinkElement'
import ConceptElement from './edit/ConceptElement'
import ImageElement from './edit/ImageElement'
import Block from './edit/Block'
import Table from "./edit/Table"
import { ElementProps } from "./edit/"

const useStyles = makeStyles(theme => ({
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
  paragraph: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
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
}))

const HOTKEYS: { [key: string]: string } = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

export type LeafProps = {
  attributes: { [key: string]: any },
  children: ReactNode,
  leaf: Text
}

const Leaf: FunctionComponent<LeafProps> = ({ attributes, children, leaf }) => {
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



const Element: FunctionComponent<ElementProps> = (props) => {
  const { attributes, children, element } = props;
  const classes = useStyles()
  switch (element.type) {
    case 'embed':
      return <Block element={element}><EmbedElement {...props} /></Block>
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
      return <LinkElement {...props} />
    case 'concept':
      return <ConceptElement {...props} />
    case 'check-list-item':
      return <Block element={element}><ChecklistItemElement {...props} /></Block>
    case 'table':
      return (
        <Block element={element}>
          <Table {...props} />
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

export const useNewEditor = () => useMemo(() => withConcepts(withEmbeds(withTables(withLists(withChecklists(withLinks(withImages(withReact(withHistory(createEditor()))))))))), [])

type EditableProps = {
  editor: Editor,
  readOnly?: boolean
} & React.TextareaHTMLAttributes<HTMLDivElement>

const Editable: FunctionComponent<EditableProps> = ({ editor, ...props }) => {
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])
  const renderElement = useCallback(props => <Element {...props} />, [])
  const { t } = useTranslation()
  return <SlateEditable
    renderLeaf={renderLeaf}
    renderElement={renderElement}
    spellCheck
    placeholder={t("editable.placeholder")}
    onKeyDown={(event) => {
      for (const hotkey in HOTKEYS) {
        if (isHotkey(hotkey, event.nativeEvent)) {
          event.preventDefault()
          const mark = HOTKEYS[hotkey]
          toggleMark(editor, mark)
        }
      }
    }}
    {...props} />
}

export default Editable

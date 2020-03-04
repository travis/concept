import React, { useCallback } from 'react';
import { Editable as SlateEditable, useSlate, Editor } from 'slate-react';


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

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
  case 'block-quote':
    return <blockquote {...attributes}>{children}</blockquote>
  case 'bulleted-list':
    return <ul {...attributes}>{children}</ul>
  case 'heading-one':
    return <h1 {...attributes}>{children}</h1>
  case 'heading-two':
    return <h2 {...attributes}>{children}</h2>
  case 'list-item':
    return <li {...attributes}>{children}</li>
  case 'numbered-list':
    return <ol {...attributes}>{children}</ol>
  default:
    return <p {...attributes}>{children}</p>
  }
}

export default function Editable({...props}){
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])
  const renderElement = useCallback(props => <Element {...props} />, [])
  return <SlateEditable
           renderLeaf={renderLeaf}
           renderElement={renderElement}
           placeholder="What's your favorite concept..."
           {...props}/>
}

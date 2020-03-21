import { Editor, Transforms, Range, Point } from 'slate';

import imageExtensions from 'image-extensions'
import isUrl from 'is-url'


const LIST_TYPES = ['numbered-list', 'bulleted-list']

export const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

export const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}


export const isBlockActive = (editor, format, at=editor.selection) => {
  const [match] = Editor.nodes(editor, {
    at,
    match: n => n.type === format,
  })

  return !!match
}

export const toggleBlock = (editor, format, at=editor.selection) => {
  const isActive = isBlockActive(editor, format, at)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    at,
    match: n => LIST_TYPES.includes(n.type),
    split: true,
  })

  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  }, { at })

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block, { at })
  }
}

export const makeBlock = (editor, format, at=editor.selection) => {
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    at,
    match: n => LIST_TYPES.includes(n.type),
    split: true,
  })

  Transforms.setNodes(editor, {
    type: isList ? 'list-item' : format,
  }, { at })

  if (isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block, { at })
  }
}

const isImageUrl = url => {
  if (!url) return false
  if (!isUrl(url)) return false
  const ext = new URL(url).pathname.split('.').pop()
  return imageExtensions.includes(ext)
}

export const withImages = editor => {
  const { insertData, isVoid } = editor

  editor.isVoid = element => {
    return element.type === 'image' ? true : isVoid(element)
  }

  editor.insertData = data => {
    const text = data.getData('text/plain')
    const { files } = data

    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader()
        const [mime] = file.type.split('/')

        if (mime === 'image') {
          reader.addEventListener('load', () => {
            const url = reader.result
            insertImage(editor, url)
          })

          reader.readAsDataURL(file)
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

export const insertImage = (editor, url) => {
  const text = { text: '' }
  const image = { type: 'image', url, children: [text] }
  Transforms.insertNodes(editor, image)
}

export const isLinkActive = editor => {
  const [link] = Editor.nodes(editor, { match: n => n.type === 'link' })
  return !!link
}

const unwrapLink = editor => {
  Transforms.unwrapNodes(editor, { match: n => n.type === 'link' })
}

const wrapLink = (editor, url) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor)
  }

  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)
  const link = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url }] : [],
  }

  if (isCollapsed) {
    Transforms.insertNodes(editor, link)
  } else {
    Transforms.wrapNodes(editor, link, { split: true })
    Transforms.collapse(editor, { edge: 'end' })
  }
}

export const withLinks = editor => {
  const { insertData, insertText, isInline } = editor

  editor.isInline = element => {
    return element.type === 'link' ? true : isInline(element)
  }

  editor.insertText = text => {
    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertText(text)
    }
  }

  editor.insertData = data => {
    const text = data.getData('text/plain')

    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

export const insertLink = (editor, url) => {
  if (editor.selection) {
    wrapLink(editor, url)
  }
}

export const removeLink = (editor) => {
  unwrapLink(editor)
}

export const withChecklists = editor => {
  const { deleteBackward } = editor

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: n => n.type === 'check-list-item',
      })

      if (match) {
        const [, path] = match
        const start = Editor.start(editor, path)

        if (Point.equals(selection.anchor, start)) {
          Transforms.setNodes(
            editor,
            { type: 'paragraph' },
            { match: n => n.type === 'check-list-item' }
          )
          return
        }
      }
    }

    deleteBackward(...args)
  }

  return editor
}

export const withLists = editor => {
  const { deleteBackward } = editor

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: n => n.type === 'list-item',
      })
      if (match) {
        const [, path] = match
        const start = Editor.start(editor, path)
        if (Point.equals(selection.anchor, start)) {
          Transforms.unwrapNodes(editor, {
            match: n => LIST_TYPES.includes(n.type),
            split: true,
          })

          Transforms.setNodes(
            editor,
            { type: 'paragraph' },
            { match: n => n.type === 'list-item' }
          )
          return
        }
      }
    }

    deleteBackward(...args)
  }

  return editor
}

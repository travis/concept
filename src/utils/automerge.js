import Automerge from 'automerge';
import { Path } from 'slate';

const Text = {
  isText(value) {
    return (typeof value.text === 'string') || (value.text && (value.text.constructor === Automerge.Text))
  }
}

const Node = {
  get(root, path) {
    let node = root
    for (let i = 0; i < path.length; i++) {
      const p = path[i]

      if (Text.isText(node) || !node.children[p]) {
        throw new Error(
          `Cannot find a descendant at path [${path}] in node: ${JSON.stringify(
            root
          )}`
        )
      }

      node = node.children[p]
    }

    return node
  },

  parent(root, path) {
    const parentPath = Path.parent(path)
    const p = Node.get(root, parentPath)

    if (Text.isText(p)) {
      throw new Error(
        `Cannot get the parent of path [${path}] because it does not exist in the root.`
      )
    }

    return p
  },

  leaf(root, path) {
    const node = Node.get(root, path)

    if (!Text.isText(node)) {
      throw new Error(
        `Cannot get the leaf node at path [${path}] because it refers to a non-leaf node: ${node}`
      )
    }

    return node
  },
}

export const toJS = node => {
  try {
    return JSON.parse(JSON.stringify(node))
  } catch (e) {
    console.error('Convert to js failed!!! Return null')
    return null
  }
}

export const toSync = node => {
  if (node){
    if (node.hasOwnProperty('text')) {
      return {
        ...node,
        text: new Automerge.Text(node.text)
      }
    } else if (node.children) {
      return {
        ...node,
        children: node.children.map(toSync)
      }
    }
    return node
  }
}

const cloneNode = node => toSync(toJS(node))

export const applySlateOps = (doc, ops) => ops.reduce(applySlateOp, doc)

export function applySlateOp(doc, op) {
  switch (op.type) {
  case 'insert_text': {
    const { path, offset, text } = op
    const node = Node.leaf(doc, path)
    if (typeof node.text === "string"){
      node.text = new Automerge.Text(node.text)
    }
    console.log("before insert", node.text, text)
    node.text.insertAt(offset, text)
    console.log("after insert", node.text)

    break
  }

  case 'remove_text': {
    const { path, offset, text } = op
    const node = Node.leaf(doc, path)
    if (typeof node.text === "string"){
      node.text = new Automerge.Text(node.text)
    }
    node.text.deleteAt(offset, text.length)

    break
  }

  case 'insert_node': {
      const { path, node } = op
      const parent = Node.parent(doc, path)
      const index = path[path.length - 1]
      parent.children.splice(index, 0, node)

      break
    }

  case 'merge_node': {
      const { path } = op
      const node = Node.get(doc, path)
      const prevPath = Path.previous(path)
      const prev = Node.get(doc, prevPath)
      const parent = Node.parent(doc, path)
      const index = path[path.length - 1]

    if (Text.isText(node) && Text.isText(prev)) {
      if (typeof prev.text === "string"){
        prev.text = new Automerge.Text(prev.text)
      }
      if (typeof node.text === "string"){
        node.text = new Automerge.Text(node.text)
      }
      prev.text.insertAt(prev.text.length, ...toJS(node.text).split(''))
    } else if (!Text.isText(node) && !Text.isText(prev)) {
      node.children.forEach(n => prev.children.push(cloneNode(n)))
    } else {
      throw new Error(
        `Cannot apply a "merge_node" operation at path [${path}] to nodes of different interaces: ${node} ${prev}`
      )
    }

    parent.children.splice(index, 1)

    break
  }

  case 'move_node': {
    const { path, newPath } = op

    if (Path.isAncestor(path, newPath)) {
      throw new Error(
        `Cannot move a path [${path}] to new path [${newPath}] because the destination is inside itself.`
      )
    }

    const node = Node.get(doc, path)
    const parent = Node.parent(doc, path)
    const index = path[path.length - 1]

    // This is tricky, but since the `path` and `newPath` both refer to
    // the same snapshot in time, there's a mismatch. After either
    // removing the original position, the second step's path can be out
    // of date. So instead of using the `op.newPath` directly, we
    // transform `op.path` to ascertain what the `newPath` would be after
    // the operation was applied.
    parent.children.splice(index, 1)
    const truePath = Path.transform(path, op)
    const newParent = Node.get(doc, Path.parent(truePath))
    const newIndex = truePath[truePath.length - 1]

    newParent.children.splice(newIndex, 0, node)

    break
  }

  case 'remove_node': {
    const { path } = op
    const index = path[path.length - 1]
    const parent = Node.parent(doc, path)
    parent.children.splice(index, 1)

    break
  }

  case 'set_node': {
    const { path, newProperties } = op

    if (path.length === 0) {
      throw new Error(`Cannot set properties on the root node!`)
    }

    const node = Node.get(doc, path)

    for (const key in newProperties) {
      if (key === 'children' || key === 'text') {
        throw new Error(`Cannot set the "${key}" property of nodes!`)
      }

      const value = newProperties[key]

      if (value == null) {
        delete node[key]
      } else {
        node[key] = value
      }
    }

    break
  }

  case 'set_selection': {
    // we don't track selection in the automerge doc
    break
  }

  case 'split_node': {
    const { path, position, properties } = op

    if (path.length === 0) {
      throw new Error(
        `Cannot apply a "split_node" operation at path [${path}] because the root node cannot be split.`
      )
    }
    console.log("split node", doc, path)

    const node = Node.get(doc, path)
    const parent = Node.parent(doc, path)
    const index = path[path.length - 1]
    let newNode = cloneNode(node)

    if (Text.isText(node)) {
      if (typeof node.text === "string"){
        node.text = new Automerge.Text(node.text)
      }
      node.text.length > position &&
        node.text.deleteAt(position, node.text.length - position)
      console.log("SPLITTING", op, node.text)
      position && newNode.text.deleteAt(0, position)
    } else {
      console.log("splitting", node, toJS(node))
      node.children.splice(position, node.children.length - position)
      position && newNode.children.splice(0, position)
    }
    console.log("parent splitting", parent, toJS(parent))
    parent.children.insertAt(index + 1, newNode)

    break
  }}
  return doc
}

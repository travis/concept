import { Node } from "slate"

export const getConceptNodes = (node: Node) => Array.from(Node.nodes(node)).filter(([n]) => {
  return (n.type === 'concept')
})

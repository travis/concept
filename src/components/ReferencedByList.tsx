import React, { useState, useEffect, FunctionComponent } from 'react'

import { Slate } from 'slate-react';

import { Ancestor, Node } from 'slate';
import { schema } from 'rdf-namespaces';

import Typography from '@material-ui/core/Typography';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { useTranslation } from 'react-i18next';

import Link from './Link';
import Editable, { useNewEditor } from "./Editable";
import { Concept, metaForPageUri } from '../utils/model'
import { useValueQuery, usePage } from '../hooks/data'
import { documentPath } from '../utils/urls'
import { getConceptNodes } from '../utils/slate'


type RBE = FunctionComponent<{
  node: Ancestor
}>

const ReferencedByExcerpt: RBE = ({ node }) => {
  const editor = useNewEditor()
  return (
    <Slate editor={editor} value={[node]} onChange={() => { }}>
      <Editable readOnly editor={editor} />
    </Slate>
  )
}

type RBID = FunctionComponent<{
  concept: Concept,
  referencedBy: string
}>

const ReferencedByItemDetails: RBID = ({ concept, referencedBy }) => {
  const [page] = usePage(referencedBy)
  const pageText = page && page.text
  const conceptUri = concept.uri
  const [excerptNodes, setExcerptNodes] = useState<Ancestor[]>([])
  useEffect(() => {
    if (pageText) {
      const rootNode = { children: JSON.parse(pageText) }
      const paths = getConceptNodes(rootNode).map(([, path]) => path)
      setExcerptNodes(paths.map(path => Node.parent(rootNode, path)))
    }
  }, [pageText, conceptUri])
  return (
    <div>
      {excerptNodes.map((node, i) => <ReferencedByExcerpt node={node} key={i} />)}
    </div>
  )
}

type ReferencedByItemProps = {
  concept: Concept,
  referencedBy: string
}

const ReferencedByItem: FunctionComponent<ReferencedByItemProps> = ({ referencedBy, concept }) => {
  const [name] = useValueQuery(referencedBy, schema.name, { source: metaForPageUri(referencedBy) })
  return (
    <ExpansionPanel TransitionProps={{ unmountOnExit: true }}>
      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
        {name && <Link to={documentPath(referencedBy)}>{name}</Link>}
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <ReferencedByItemDetails concept={concept} referencedBy={referencedBy} />
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}

type ReferencedByListProps = {
  concept: Concept
}

const ReferencedByList: FunctionComponent<ReferencedByListProps> = ({ concept }) => {
  const count = concept.referencedBy.length
  const { name } = concept
  const { t } = useTranslation()
  return (
    <>
      <Typography variant="h6">
        {t('referencedByList.title', { count, name })}
      </Typography>
      {concept.referencedBy.map(referencedBy => (
        <ReferencedByItem referencedBy={referencedBy} concept={concept} key={referencedBy} />
      ))}
    </>
  )
}

export default ReferencedByList

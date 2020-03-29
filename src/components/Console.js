import React from 'react'
import { LiveUpdate } from "@solid/react";

import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';

import { addPage } from "../utils/data"
import { useWorkspace, usePages, usePageListItems } from "../hooks/data"

function Workspace({workspace}){
  const pageListItems = usePageListItems(workspace)
  return (
    <div>
      {workspace && <Link href={workspace.uri}>{workspace.uri}</Link>}
      <Button onClick={() => addPage(workspace)}>add child</Button>
      {pageListItems && pageListItems.map(item => <div key={item.pageNode.value}>{item.pageNode.value}</div>)}
    </div>
  )
}

export default function Console(){
  const workspace = useWorkspace()
  return (
    <LiveUpdate subscribe={workspace && workspace.docUri}>
      <Workspace workspace={workspace}/>
    </LiveUpdate>
  )
}

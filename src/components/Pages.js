import React, {useContext} from 'react'
import WorkspaceContext from "../context/workspace"
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import {space, rdf, solid, schema} from 'rdf-namespaces';

export default function Pages(){
  const {pages, addPage, deletePage} = useContext(WorkspaceContext)
  return (
    <Box>
      {pages && pages.map(p => (
        <>
          <p key={p.asRef()}>{p.getString(schema.name)}</p>
          <Button onClick={() => deletePage(p.asRef())}>Delete</Button>
        </>
      ))}
      <Button onClick={() => addPage()}>Add Page</Button>
    </Box>
  )
}

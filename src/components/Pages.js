import React, {createRef, useContext, useCallback, useState} from 'react'
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import {space, rdf, solid, schema} from 'rdf-namespaces';
import { throttle, debounce } from 'throttle-debounce';

import 'codemirror/lib/codemirror.css';
import 'tui-editor/dist/tui-editor.min.css';
import 'tui-editor/dist/tui-editor-contents.min.css';
import { Editor } from '@toast-ui/react-editor'

import WorkspaceContext from "../context/workspace"

function Page({page, updatePage, deletePage}){
  const [saving, setSaving] = useState(false)
  const body = page.getString(schema.text)
  const editorRef = createRef();
  const onChange = useCallback(async function() {
    const text = editorRef.current && editorRef.current.getInstance().getValue()
    if (text && (text != body)) {
      page.setLiteral(schema.text, text)
      setSaving(true)
      await updatePage(page)
      setSaving(false)
    }
  }, [page, editorRef]);
  return (
    <div>
      <h3>{page.getString(schema.name)}</h3>
      {saving && "Saving..."}
      <Editor
        ref={editorRef}
        initialValue={body}
        previewStyle="tab"
        height="600px"
        initialEditType="markdown"
        useCommandShortcut={true}
        onChange={debounce(1000, onChange)}
      />
      <Button onClick={() => deletePage(page.asRef())}>Delete</Button>
    </div>
  )
}

export default function Pages(){
  const {pages, addPage, updatePage, deletePage} = useContext(WorkspaceContext)
  return (
    <Box>
      {pages && pages.map(page => (
        <Page page={page} updatePage={updatePage} deletePage={deletePage} key={page.asRef()}/>
      ))}
      <Button onClick={() => addPage()}>Add Page</Button>
    </Box>
  )
}

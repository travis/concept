import React, {createRef, useContext, useCallback, useState, useEffect} from 'react'
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import {space, rdf, solid, schema} from 'rdf-namespaces';
import { throttle, debounce } from 'throttle-debounce';

import 'codemirror/lib/codemirror.css';
import 'tui-editor/dist/tui-editor.min.css';
import 'tui-editor/dist/tui-editor-contents.min.css';
import { Editor } from '@toast-ui/react-editor'

import WorkspaceContext from "../context/workspace"
import PageDrawer from './PageDrawer'

function Page({page, updatePage, deletePage, className}){
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
    <div className={className}>
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
    </div>
  )
}

const useStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    marginLeft: 240
  },
}));


export default function Pages(){
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const {pages, addPage, updatePage, deletePage} = useContext(WorkspaceContext);
  const page = pages && pages[selectedPageIndex];
  const classes = useStyles()

  return (
    <>
      <PageDrawer pages={pages} setSelectedPageIndex={setSelectedPageIndex}
                  addPage={addPage} deletePage={deletePage}/>
      <Box className={classes.content}>
        {page && <Page page={page} updatePage={updatePage} />}
      </Box>
    </>
  )
}

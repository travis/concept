import React, {useRef, useContext, useCallback, useState, useEffect} from 'react'
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import { schema} from 'rdf-namespaces';
import { debounce } from 'throttle-debounce';

import 'codemirror/lib/codemirror.css';
import 'tui-editor/dist/tui-editor.min.css';
import 'tui-editor/dist/tui-editor-contents.min.css';
import { Editor } from '@toast-ui/react-editor'

import WorkspaceContext from "../context/workspace"
import PageDrawer from './PageDrawer'

const useStyles = makeStyles(theme => ({
  saving: {
    position: "fixed",
    right: 0,
    zIndex: 1000
  }
}));

function Page({page, updatePage, deletePage, className}){
  const classes = useStyles();
  const [saving, setSaving] = useState(false);
  const editorRef = useRef();
  const onChange = useCallback(async function() {
    const text = editorRef.current && editorRef.current.getInstance().getValue();
    if (text && (text !== page.getString(schema.text))) {
      page.setLiteral(schema.text, text)
      setSaving(true)
      await updatePage(page)
      setSaving(false)
    }
  }, [page, editorRef, updatePage]);
  useEffect(() => {
    if (editorRef.current){
      editorRef.current.getInstance().setMarkdown(page.getString(schema.text));
    }
  }, [page, editorRef]);
  return (
    <div className={className}>
      <h3>{page.getString(schema.name)}</h3>
      <p className={classes.saving}>{saving && "Saving..."}</p>
      <Editor
        ref={editorRef}
        initialValue={page.getString(schema.text)}
        previewStyle="tab"
        height="600px"
        initialEditType="markdown"
        useCommandShortcut={true}
        onChange={debounce(1000, onChange)}
      />
    </div>
  )
}

const usePagesStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    marginLeft: 240
  },
}));


export default function Pages(){
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const {pages, addPage, updatePage, deletePage} = useContext(WorkspaceContext);
  const page = pages && pages[selectedPageIndex];
  const classes = usePagesStyles()

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

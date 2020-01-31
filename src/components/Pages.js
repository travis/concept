import React, {useRef, useContext, useCallback, useState, useEffect} from 'react'
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { schema} from 'rdf-namespaces';
import { useDebounce } from 'use-debounce';
import {fetchDocument} from 'tripledoc';

import 'codemirror/lib/codemirror.css';
import 'tui-editor/dist/tui-editor.min.css';
import 'tui-editor/dist/tui-editor-contents.min.css';
import { Editor } from '@toast-ui/react-editor';

import WorkspaceContext from "../context/workspace";
import PageDrawer from './PageDrawer';


const useStyles = makeStyles(theme => ({
  saving: {
    position: "fixed",
    right: 0,
    zIndex: 1000
  }
}));

function PageName({page, updatePage}){
  const {saveName} = useContext(WorkspaceContext);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(page.getString(schema.name));
  useEffect(() => setName(page.getString(schema.name)), [page])
  const save = useCallback(async function(value) {
    if (value && (value !== page.getString(schema.name))) {
      await saveName(page.getDocument(), value);
    }
  }, [page, updatePage]);

  const [debouncedName] = useDebounce(name, 1000);
  useEffect(() => {
    save(debouncedName)
  }, [save, debouncedName])

  return editing ? (
    <TextField label="Page Name" variant="standard" autoFocus
               value={name}
               onKeyDown={(e) => (e.key === 'Enter') && setEditing(false)}
               onChange={(e) => setName(e.target.value)}/>
  ) : (
    <h3 onClick={() => setEditing(true)}>{name}</h3>
  );
}

function Page({pageRef, updatePage, deletePage, className}){
  const [page, setPage] = useState(null)
  const [pageDoc, setPageDoc] = useState(null)
  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [debouncedText] = useDebounce(text, 1000);

  useEffect(() => {
    const loadPage = async () => {
      const pageD = await fetchDocument(pageRef);
      const p = pageD.getSubject(pageRef);
      const t = p.getString(schema.text) || ""
      setText(t)
      setSavedText(t)
      setPageDoc(pageD)
      setPage(p);
    }
    loadPage()
  }, [pageRef])
  const classes = useStyles();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saveText = async () => {
      page.setLiteral(schema.text, debouncedText)
      setSaving(true)
      const newPageDoc = await pageDoc.save([page]);
      setSavedText(debouncedText)
      setPageDoc(newPageDoc);
      setPage(newPageDoc.getSubject(pageRef))
      setSaving(false)
    }
    if (page && pageDoc && (debouncedText === text) && (debouncedText !== savedText)) {
      saveText(debouncedText)
    }
  }, [savedText, page, pageDoc, pageRef, debouncedText])

  const editorRef = useRef();
  useEffect(() => {
    if (page) {
      const value = page.getString(schema.text);
      setText(value)
      editorRef.current.getInstance().setMarkdown(value);
    }
  }, [page, editorRef])
  return page ? (
    <div className={className}>
      <PageName page={page} updatePage={updatePage}/>
      <p className={classes.saving}>{saving && "Saving..."}</p>
      <Editor
        ref={editorRef}
        initialValue={text}
        previewStyle="tab"
        height="600px"
        initialEditType="markdown"
        useCommandShortcut={true}
        onChange={() => editorRef.current && setText(editorRef.current.getInstance().getValue())}
      />
    </div>
  ) : <div>Loading...</div>
}

const usePagesStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    marginLeft: 240
  },
}));


export default function Pages(){
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const {workspace, pages, addPage, updatePage, deletePage} = useContext(WorkspaceContext);
  const pageRef = pages && pages[selectedPageIndex];
  const classes = usePagesStyles()

  return (
    <>
      <PageDrawer workspace={workspace} pages={pages} setSelectedPageIndex={setSelectedPageIndex}
                  addPage={addPage} deletePage={deletePage}/>
      <Box className={classes.content}>
        {pageRef && <Page pageRef={pageRef} updatePage={updatePage} />}
      </Box>
    </>
  )
}

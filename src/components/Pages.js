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
  const [name, setName] = useState(null);
  const [savedName, setSavedName] = useState(null);
  const [debouncedName] = useDebounce(name, 1000);
  useEffect(() => {
    console.log("set name effect")
    if (page) {
      console.log("setting page name")
      const loadName = async () => {
        const n = await page.getName()
        setName(n)
        setSavedName(n)
      }
      loadName()
    }
  }, [page])

  useEffect(() => {
    console.log("save page name effect")
    if ((savedName !== null) && (name === debouncedName) && (debouncedName !== savedName)) {
      console.log("saving page name", savedName, name, debouncedName)
      const save = async function() {
        await page.setName(debouncedName);
        setSavedName(debouncedName)
      }
      save(debouncedName)
    }
  }, [page, savedName, name, debouncedName, saveName])

  return editing ? (
    <TextField label="Page Name" variant="standard" autoFocus
               value={name}
               onKeyDown={(e) => (e.key === 'Enter') && setEditing(false)}
               onChange={(e) => setName(e.target.value)}/>
  ) : (
    <h3 onClick={() => setEditing(true)}>{name}</h3>
  );
}

function Page({page, updatePage, deletePage, className}){
  const [text, setText] = useState(null);
  const [savedText, setSavedText] = useState(null);
  const [debouncedText] = useDebounce(text, 1000);

  useEffect(() => {
    const loadText = async () => {
      console.log("loading text for page", page, await page.getText())
      const t = (await page.getText());
      setText(t)
      setSavedText(t)
    }
    loadText()
  }, [page])
  const classes = useStyles();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saveText = async () => {
      setSaving(true)
      await page.setText(debouncedText)
      setSavedText(debouncedText)
      setSaving(false)
    }
    if (page && (debouncedText === text) && (debouncedText !== savedText)) {
      saveText()
    }
  }, [page, savedText, text, debouncedText])

  const editorRef = useRef();
  useEffect(() => {
    if (savedText !== null) {
      setText(savedText)
      editorRef.current.getInstance().setMarkdown(savedText);
    }
  }, [editorRef, savedText])
  return page ? (
    <div className={className}>
      {<PageName page={page} updatePage={updatePage}/>}
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
  const page = pages && pages[selectedPageIndex];
  const classes = usePagesStyles()

  return (
    <>
      <PageDrawer workspace={workspace} pages={pages} setSelectedPageIndex={setSelectedPageIndex}
                  addPage={addPage} deletePage={deletePage}/>
      <Box className={classes.content}>
        {page && <Page page={page} updatePage={updatePage} />}
      </Box>
    </>
  )
}

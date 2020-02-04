import React, {useRef, useContext, useState, useEffect} from 'react'
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { schema} from 'rdf-namespaces';
import { useDebounce } from 'use-debounce';

import 'codemirror/lib/codemirror.css';
import 'tui-editor/dist/tui-editor.min.css';
import 'tui-editor/dist/tui-editor-contents.min.css';
import { Editor } from '@toast-ui/react-editor';

import WorkspaceContext from "../context/workspace";
import PageDrawer from './PageDrawer';
import {useLDflex} from "@solid/react";


const useStyles = makeStyles(theme => ({
  saving: {
    position: "fixed",
    right: 0,
    zIndex: 1000
  }
}));

function PageName({page, updatePage}){
  const [editing, setEditing] = useState(false);
  const [savedNameNode, loading] = useLDflex(`[${page}][${schema.name}]`);
  const savedName = savedNameNode && savedNameNode.toString();
  const [name, setName] = useState(savedName);
  useEffect(() => {
    setName(`${savedName}`);
  }, [savedName])

  const [debouncedName] = useDebounce(name, 1000);

  useEffect(() => {
    if (!loading && debouncedName && (debouncedName === name) && (debouncedName !== savedName)) {
      updatePage(page, schema.name, debouncedName);
    }
  }, [loading, page, savedName, name, debouncedName, updatePage])

  return editing ? (
    <TextField label="Page Name" variant="standard" autoFocus
               value={name}
               onKeyDown={(e) => (e.key === 'Enter') && setEditing(false)}
               onChange={(e) => setName(e.target.value)}/>
  ) : (
    <h3 onClick={() => setEditing(true)}>{name}</h3>
  );
}

function Page({page, deletePage, className}){
  const {updatePage} = useContext(WorkspaceContext);
  const classes = useStyles();
  const [saving, setSaving] = useState(false);
  const [savedTextNode, savedTextLoading] = useLDflex(`[${page}][${schema.text}]`);
  const savedText = savedTextNode && savedTextNode.toString()
  const [text, setText] = useState(savedText);
  const [debouncedText] = useDebounce(text, 1000);
  useEffect(() => {
    setText(savedText);
  }, [savedText])

  useEffect(() => {
    if (!savedTextLoading && (debouncedText === text) && (debouncedText !== savedText)) {
      setSaving(true)
      updatePage(page, schema.text, debouncedText)
      setSaving(false)
    }
  }, [page, savedTextLoading, savedText, text, debouncedText, updatePage])

  const editorRef = useRef();
  useEffect(() => {
    editorRef.current.getInstance().setMarkdown(`${savedText}`);
  }, [editorRef, savedText])
  return (
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
  )
}

const usePagesStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    marginLeft: 240
  },
}));


export default function Pages({workspace, addPage}){
  const [selectedPage, setSelectedPage] = useState(null);
  const classes = usePagesStyles()
  return (
    <>
      <PageDrawer {...{workspace, setSelectedPage, selectedPage}}/>
      <Box className={classes.content}>
        {selectedPage && (<Page page={selectedPage}/>)}
      </Box>
    </>
  )
}

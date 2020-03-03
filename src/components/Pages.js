import React, {useRef, useContext, useState, useEffect} from 'react'
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { schema} from 'rdf-namespaces';
import { useDebounce } from 'use-debounce';
import { Switch, Route, Link, useParams } from "react-router-dom";

import 'codemirror/lib/codemirror.css';
import 'tui-editor/dist/tui-editor.min.css';
import 'tui-editor/dist/tui-editor-contents.min.css';
import { Editor } from '@toast-ui/react-editor';

import WorkspaceContext from "../context/workspace";
import PageDrawer from './PageDrawer';
import {LiveUpdate} from "@solid/react";
import {useLDflex} from '../hooks/ldflex';

const useStyles = makeStyles(theme => ({
  saving: {
    position: "fixed",
    right: 0,
    zIndex: 1000
  }
}));

function PageName({workspace, page}){
  const {updatePage} = useContext(WorkspaceContext);
  const [editing, setEditing] = useState(false);
  const [savedNameNode] = useLDflex(`from('${workspace}')[${page}][${schema.name}]`);
  const savedName = savedNameNode && savedNameNode.toString();
  const [name, setName] = useState(savedName);
  useEffect(() => {
    savedName && setName(`${savedName}`);
  }, [savedName])

  const saveAndStopEditing = async () => {
    setEditing(false)
    await updatePage(page, schema.name, name)
  }

  return editing ? (
    <TextField label="Page Name" variant="standard" autoFocus
               value={name}
               onKeyDown={(e) => (e.key === 'Enter') && saveAndStopEditing()}
               onBlur={() => saveAndStopEditing()}
               onChange={(e) => setName(e.target.value)}/>
  ) : (
    <h3 onClick={() => setEditing(true)}>{name}</h3>
  );
}

function PageTextEditor({page}){
  const {updatePage} = useContext(WorkspaceContext);
  const classes = useStyles();
  const [saving, setSaving] = useState(false);
  const [pageTextNode, pageTextLoading] = useLDflex(`[${page}][${schema.text}]`);
  const pageText = pageTextNode && pageTextNode.value;
  const [editorText, setEditorText] = useState(null);
  const [debouncedText] = useDebounce(editorText, 1000);
  useEffect(() => {
    // set editor text to null when the page changes so we won't save page text from another page to the current page
    setEditorText(null);
  }, [page])
  useEffect(() => {
    // once pageText loads, set editorText
    (pageText !== undefined) && (pageText !== null) && setEditorText(pageText);
  }, [pageText]);

  useEffect(() => {
    const maybeSave = async () => {
      if ((editorText !== null) && (debouncedText !== null) && (debouncedText === editorText) && (debouncedText !== pageText)) {
        setSaving(true);
        await updatePage(page, schema.text, debouncedText);
        setSaving(false);
      }
    }
    maybeSave();
  }, [page, pageText, editorText, debouncedText, updatePage])
  const editorRef = useRef();
  useEffect(() => {
    editorRef.current.getInstance().setMarkdown(editorText || "");
  }, [editorRef, editorText])
  return (
    <>
      <p className={classes.saving}>{saving && "Saving..."}</p>
      <Editor
        ref={editorRef}
        initialValue={editorText || ""}
        previewStyle="tab"
        height="600px"
        initialEditType="markdown"
        useCommandShortcut={true}
        onChange={() => editorRef.current && setEditorText(editorRef.current.getInstance().getValue())}
      />
    </>
  );
}

function Page({workspace, page}){
  return (
    <>
      <LiveUpdate subscribe={[workspace.toString()]}>
        <PageName workspace={workspace} page={page} />
      </LiveUpdate>
      <LiveUpdate subscribe={page.toString()}>
        <PageTextEditor page={page.toString()}/>
      </LiveUpdate>
    </>
  )
}

const usePagesStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    marginLeft: 240
  },
}));


function CurrentPage({workspace}) {
  const { selectedPage } = useParams();
  const selectedPageURI = decodeURIComponent(selectedPage)
  return selectedPage ? (
    <LiveUpdate subscribe={selectedPageURI.toString()}>
      <Page workspace={workspace} page={selectedPageURI}/>
    </LiveUpdate>
  ) : (
    <p>Welcome to Concept! Add or select a page on the left to get started.</p>
  )
}

export default function Pages({workspace, addPage}){
  const classes = usePagesStyles()
  return (
    <>
      {workspace ? (
        <LiveUpdate subscribe={[workspace.toString()]}>
          <PageDrawer {...{workspace}}/>
        </LiveUpdate>
      ) : (
        <PageDrawer/>
      )}
      <Box className={classes.content}>
        {workspace && <CurrentPage workspace={workspace}/>}
      </Box>
    </>
  )
}

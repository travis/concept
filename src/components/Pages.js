import React, { useContext, useState, useEffect, useMemo } from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import SaveIcon from '@material-ui/icons/Save'

import { schema} from 'rdf-namespaces';
import { useDebounce } from 'use-debounce';
import { useParams } from "react-router-dom";

import { createEditor } from 'slate';
import { Slate, withReact } from 'slate-react';
import Editable from "./Editable";
import EditorToolbar from "./EditorToolbar";

import WorkspaceContext from "../context/workspace";
import PageDrawer from './PageDrawer';
import {LiveUpdate} from "@solid/react";
import {useLDflex} from '../hooks/ldflex';

const useStyles = makeStyles(theme => ({
  saving: {
    position: "absolute",
    left: theme.spacing(2),
    top: 0,
    zIndex: 1000
  },
  editor: {
    textAlign: "left",
    padding: theme.spacing(2),
    background: "white",
    position: "relative",
    height: "600em"
  },
  toolbar: {
    minHeight: theme.spacing(1),
    paddingLeft: 0
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
    <Typography variant="h5" onClick={() => setEditing(true)}>{name}</Typography>
  );
}

function PageTextEditor({page}){
  const {updatePage} = useContext(WorkspaceContext);
  const classes = useStyles();
  const [saving, setSaving] = useState(false);
  const [pageTextNode] = useLDflex(`[${page}][${schema.text}]`);
  const pageText = pageTextNode && pageTextNode.value;
  const [editorValue, setEditorValue] = useState(undefined);
  const [saveNeeded, setSaveNeeded] = useState(false);
  const [debouncedValue] = useDebounce(editorValue, 1000);
  useEffect(() => {
    // set editor text to null when the page changes so we won't save page text from another page to the current page
    setEditorValue(undefined);
  }, [page])

  useEffect(() => {
    // once pageText loads, set editorValue
    if ((pageText !== undefined) && (pageText !== null)) {
      setEditorValue(JSON.parse(pageText))
    }
  }, [pageText]);

  useEffect(() => {
    const maybeSave = async () => {
      const saveableText = JSON.stringify(debouncedValue);
      if (saveableText !== pageText) {
        setSaving(true);
        await updatePage(page, schema.text, saveableText);
        setSaving(false);
      }
    }
    if (saveNeeded) {
      setSaveNeeded(false);
      maybeSave();
    }
  }, [saveNeeded, page, pageText, debouncedValue, updatePage])

  useEffect(() => {
    if (debouncedValue !== undefined) {
      setSaveNeeded(true);
    }
  }, [debouncedValue])

  const editor = useMemo(() => withReact(createEditor()), [])
  return (
    <>
      {saving && <SaveIcon className={classes.saving}/>}
      <Slate editor={editor}
             value={(editorValue === undefined) ? [] : editorValue}
             onChange={value => setEditorValue(value)}>
        <EditorToolbar className={classes.toolbar} />
        <Paper className={classes.editor}>
          <Editable autoFocus />
        </Paper>
      </Slate>
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
    marginLeft: 240,
    position: "relative",
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

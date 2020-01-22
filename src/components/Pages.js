import React, {useRef, useContext, useCallback, useState, useEffect} from 'react'
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


const useStyles = makeStyles(theme => ({
  saving: {
    position: "fixed",
    right: 0,
    zIndex: 1000
  }
}));

function PageName({page, updatePage}){
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(page.getString(schema.name));
  useEffect(() => setName(page.getString(schema.name)), [page])
  const save = useCallback(async function(value) {
    if (value && (value !== page.getString(schema.name))) {
      page.setLiteral(schema.name, value);
      await updatePage(page);
    }
  }, [page]);

  const [debouncedName] = useDebounce(name, 1000);
  useEffect(() => {
    save(debouncedName)
  }, [debouncedName])

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
  const classes = useStyles();
  const [saving, setSaving] = useState(false);

  const [text, setText] = useState(page.getString(schema.text));
  const saveText = useCallback(async (value) => {
    if (value !== page.getString(schema.text)) {
      page.setLiteral(schema.text, value)
      setSaving(true)
      await updatePage(page)
      setSaving(false)
    }
  }, [page])

  const [debouncedText] = useDebounce(text, 1000);
  useEffect(() => {
    saveText(debouncedText)
  }, [debouncedText])

  const editorRef = useRef();
  useEffect(() => {
    const value = page.getString(schema.text);
    setText(value)
    editorRef.current.getInstance().setMarkdown(value);

  }, [page, editorRef])
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

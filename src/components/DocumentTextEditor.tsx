import React, { useContext, useState, useRef, useCallback, useEffect } from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import SaveIcon from '@material-ui/icons/Save'
import { useDebounce } from 'use-debounce';

import { Slate } from 'slate-react';
import { Node } from 'slate';

import { HoveringToolbar } from "./EditorToolbar";
import Editable, { useNewEditor } from "./Editable";
import { Document } from "../utils/model"
import { getConceptNodes } from "../utils/slate"
import WorkspaceContext from "../context/workspace";
import { useBackups } from '../hooks/backup';
import { usePreferences } from '../context/preferences'

const useStyles = makeStyles(theme => ({
  saving: {
    position: "fixed",
    right: theme.spacing(0),
    top: "78px",
    zIndex: 1000,
    color: theme.palette.primary.light
  },
  editor: {
    height: "100%",
    overflow: "scroll"
  },
  editable: {
    marginTop: theme.spacing(6),
    textAlign: "left",
    padding: theme.spacing(1),
    paddingLeft: theme.spacing(8),
    paddingRight: theme.spacing(8),
    paddingTop: 0,
    background: "white",
    height: "100%",
    flexGrow: 2
  },
  devConsole: {
    flexGrow: 1,
    fontSize: "0.66em",
    textAlign: "left"
  }
}));

interface DocumentTextEditorProps {
  document: Document,
  readOnly: boolean
}

export default function DocumentTextEditor({ document, readOnly }: DocumentTextEditorProps) {
  const documentUri = document.uri
  const { updateText } = useContext(WorkspaceContext);
  const classes = useStyles();
  const [saving, setSaving] = useState(false);
  const documentText = document.text;
  const [editorValue, setEditorValue] = useState<Node[] | undefined>(undefined);
  const [saveNeeded, setSaveNeeded] = useState(false);
  const [debouncedValue] = useDebounce(editorValue, 1500);
  const savedVersionsRef = useRef<Array<string>>([])
  const setSavedVersions = useCallback<(mutate: (current: Array<string>) => Array<string>) => void>(
    (mutate) => {
      savedVersionsRef.current = mutate(savedVersionsRef.current)
    },
    [savedVersionsRef]
  )
  const editor = useNewEditor()

  useEffect(() => {
    // set editor text to null when the document changes so we won't save document text from another document to the current document
    editor.children = undefined
    setEditorValue(undefined);
    savedVersionsRef.current = []
  }, [editor, documentUri])

  useBackups(document, editorValue)

  const previouslySaved = useCallback(
    (text) => savedVersionsRef.current.some(previousVersion => previousVersion === text),
    [savedVersionsRef]
  )

  useEffect(() => {
    // once documentText loads, set editorValue
    if ((documentText !== undefined) && (documentText !== null)) {
      setEditorValue(currentValue => {
        if ((JSON.stringify(currentValue) === documentText) ||
          previouslySaved(documentText)) {
          return currentValue
        } else {
          return JSON.parse(documentText)
        }
      })
    }
    // include documentUri here so that we run this after setting editorValue to undefined above
  }, [documentUri, documentText, previouslySaved, savedVersionsRef]);

  useEffect(() => {
    const maybeSave = async () => {
      const saveableText = JSON.stringify(debouncedValue);
      if (saveableText !== documentText) {
        setSaving(true);
        if (updateText) {
          const conceptUris = getConceptNodes(editor).map(([concept]) => concept.uri)
          await updateText(document, saveableText, conceptUris);
        }
        setSavedVersions(currentSavedVersions => [saveableText, ...currentSavedVersions].slice(0, 100))
        setSaving(false);
      }
    }
    if (saveNeeded) {
      setSaveNeeded(false);
      maybeSave();
    }
  }, [saveNeeded, document, documentText, debouncedValue, updateText, setSavedVersions, editor])

  useEffect(() => {
    if (debouncedValue !== undefined) {
      setSaveNeeded(true);
    }
  }, [debouncedValue])
  const { devMode } = usePreferences()
  return (
    <Paper className={classes.editor}>
      {saving && <SaveIcon className={classes.saving} />}
      {editorValue === undefined ? (
        <div>Loading...</div>
      ) : (
          <Slate editor={editor}
            value={editorValue === undefined ? [] : editorValue}
            onChange={newValue => setEditorValue(newValue)}>
            {!readOnly && (
              <>
                <HoveringToolbar />
              </>
            )}
            <Box display="flex" flexDirection="column" height="100%">
              <Editable autoFocus readOnly={readOnly} editor={editor}
                className={classes.editable} />
              {devMode && (
                <Paper className={classes.devConsole}>
                  <code>
                    {JSON.stringify(editorValue, null, 2)}
                  </code>
                </Paper>
              )}
            </Box>
          </Slate>
        )}
    </Paper>
  );
}

import React, { useContext, useState, useRef, useCallback, useEffect } from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import SaveIcon from '@material-ui/icons/Save'
import { schema } from 'rdf-namespaces';
import { useDebounce } from 'use-debounce';

import { Slate } from 'slate-react';
import { Node } from 'slate';

import { HoveringToolbar } from "./EditorToolbar";
import Editable, { useNewEditor } from "./Editable";
import { Page } from "../utils/model"
import WorkspaceContext, { WorkspaceContextType } from "../context/workspace";
import { useLDflex } from '../hooks/ldflex';
import { useBackups } from '../hooks/backup';

const useStyles = makeStyles(theme => ({
  saving: {
    position: "fixed",
    right: theme.spacing(0),
    top: "78px",
    zIndex: 1000,
    color: theme.palette.primary.light
  },
  editor: {
    position: "relative",
    height: "100%",
    overflow: "scroll"
  },
  editable: {
    marginTop: "48px",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "left",
    padding: theme.spacing(1),
    paddingLeft: theme.spacing(8),
    paddingRight: theme.spacing(8),
    paddingTop: 0,
    background: "white",
    position: "absolute"

  }
}));

interface PageTextEditorProps {
  page: Page,
  readOnly: boolean
}

export default function PageTextEditor({ page, readOnly }: PageTextEditorProps) {
  const { updatePage } = useContext<WorkspaceContextType>(WorkspaceContext);
  const classes = useStyles();
  const [saving, setSaving] = useState(false);
  const [pageTextNode] = useLDflex(`[${page}][${schema.text}]`);
  const pageText = pageTextNode && pageTextNode.value;
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
    // set editor text to null when the page changes so we won't save page text from another page to the current page
    editor.children = undefined
    setEditorValue(undefined);
    savedVersionsRef.current = []
  }, [editor, page])

  useBackups(page, editorValue)

  const previouslySaved = useCallback(
    (text) => savedVersionsRef.current.some(previousVersion => previousVersion === text),
    [savedVersionsRef]
  )

  useEffect(() => {
    // once pageText loads, set editorValue
    if ((pageText !== undefined) && (pageText !== null)) {
      setEditorValue(currentValue => {
        if ((JSON.stringify(currentValue) === pageText) ||
          previouslySaved(pageText)) {
          return currentValue
        } else {
          return JSON.parse(pageText)
        }
      })
    }
  }, [pageText, previouslySaved, savedVersionsRef]);

  useEffect(() => {
    const maybeSave = async () => {
      const saveableText = JSON.stringify(debouncedValue);
      if (saveableText !== pageText) {
        setSaving(true);
        if (updatePage) {
          await updatePage(page, schema.text, saveableText);
        }
        setSavedVersions(currentSavedVersions => [saveableText, ...currentSavedVersions].slice(0, 100))
        setSaving(false);
      }
    }
    if (saveNeeded) {
      setSaveNeeded(false);
      maybeSave();
    }
  }, [saveNeeded, page, pageText, debouncedValue, updatePage, setSavedVersions])

  useEffect(() => {
    if (debouncedValue !== undefined) {
      setSaveNeeded(true);
    }
  }, [debouncedValue])

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

            <Editable autoFocus readOnly={readOnly} editor={editor}
              className={classes.editable} />
          </Slate>
        )}
    </Paper>
  );
}

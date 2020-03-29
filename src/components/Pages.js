import React, { useContext, useState, useEffect, useCallback, useRef } from 'react'

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import IconButton from './IconButton';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';

import SaveIcon from '@material-ui/icons/Save'
import ShareIcon from '@material-ui/icons/Share'
import BackupIcon from '@material-ui/icons/Backup'
import MenuIcon from '@material-ui/icons/Menu'

import { schema} from 'rdf-namespaces';
import { useDebounce } from 'use-debounce';
import { useHistory } from "react-router-dom";

import { Slate } from 'slate-react';

import Editable, {useNewEditor} from "./Editable";
import {HoveringToolbar} from "./EditorToolbar";
import SharingModal from "./SharingModal";
import BackupsDialog from "./BackupsDialog";

import WorkspaceContext from "../context/workspace";
import PageContext from '../context/page'

import PageDrawer from './PageDrawer';
import PageTextEditor from './PageTextEditor'
import { LiveUpdate } from "@solid/react";
import { useLDflex } from '../hooks/ldflex';
import { useAccessInfo } from '../hooks/acls';
import { useBackups } from '../hooks/backup';
import { useCurrentPage } from '../hooks/pages';
import {drawerWidth} from '../constants'
import Page from './Page'

const usePagesStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    marginLeft: 240,
    position: "relative",
    height: "100%"
  },
}));

function CurrentPage() {
  const [currentPage] = useCurrentPage()
  return currentPage ? (
    <LiveUpdate subscribe={currentPage.uri}>
      <Page page={currentPage}/>
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
        <LiveUpdate subscribe={[workspace.uri]}>
          <PageDrawer workspace={workspace}/>
        </LiveUpdate>
      ) : (
        <PageDrawer/>
      )}
      <Box className={classes.content}>
        {workspace && <CurrentPage />}
      </Box>
    </>
  )
}

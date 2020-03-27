import React, {useState, useCallback} from 'react';

import {useWebId} from '@solid/react';
import data from '@solid/query-ldflex';
import {namedNode} from '@rdfjs/data-model';
import copy from 'copy-to-clipboard';

import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import Avatar from '@material-ui/core/Avatar';
import Link from '@material-ui/core/Link';

import CloseIcon from '@material-ui/icons/Close';
import CopyIcon from '@material-ui/icons/FileCopy';

import Autocomplete from '@material-ui/lab/Autocomplete';

import Close from '@material-ui/icons/Close';
import Add from '@material-ui/icons/Add';
import { schema, foaf, acl, vcard } from 'rdf-namespaces';

import { useDrag, useDrop } from 'react-dnd'

import Loader from './Loader';
import { useLDflexValue, useLDflexList } from '../hooks/ldflex';
import { useAclExists, useParentAcl } from '../hooks/acls';
import { createDefaultAcl } from '../utils/acl';
import { sharingUrl } from '../utils/urls';

const useStyles = makeStyles(theme => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500]
  },
  permissionsType: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  agent: {
    cursor: ({readOnly}) => readOnly ? "default" : "pointer",
  },
  agents: ({draggedOver}) => ({
    padding: theme.spacing(1),
    minHeight: theme.spacing(6),
    backgroundColor: theme.palette.grey[draggedOver ? 200 : 50]
  }),
  sharingLink: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis"
  }
}));

const Agent = ({agent, deleteAgent, readOnlyAcl, permissionsType}) => {
  const avatarUriNode = useLDflexValue(`[${agent}][${vcard.hasPhoto}]`)
  const avatarUri = avatarUriNode && avatarUriNode.value
  const nameNode = useLDflexValue(`[${agent}][${vcard.fn}]`)
  const name = nameNode && nameNode.value
  const webId = useWebId();
  const readOnly = readOnlyAcl || (agent === webId)
  const [, chip] = useDrag({
    item: {
      type: "agent",
      draggedPermissionsType: permissionsType,
      draggedAgentWebId: agent,
      deleteDraggedAgentFromCurrent: deleteAgent
    }
  })
  const classes = useStyles({readOnly})
  return (
    <Chip ref={readOnly ? null : chip}
          label={name}
          className={classes.agent}
          avatar={<Avatar alt={name} src={avatarUri}/>}
          onDelete={readOnly ? null : deleteAgent }/>
  )
}

const ModeDescription = ({type}) => {
  if (type === "Owners") {
    return "Owners"
  } else if (type === "Writers") {
    return "Writers"
  } else if (type === "Readers") {
    return "Readers"
  } else {
    return "Custom Permissions"
  }
}

const PermissionsType = ({ aclUri, type, readOnly }) => {
  const uri = `${aclUri}#${type}`
  const [adding, setAdding] = useState(false)
  const agents = useLDflexList(`[${uri}][${acl.agent}]`);
  const webId = useWebId();
  const friends = useLDflexList(`[${webId}][${foaf.knows}]`)
  const addAgent = useCallback(async (agent) => {
    await data[uri][acl.agent].add(namedNode(agent))
  }, [uri])
  const deleteAgent = useCallback(async (agent) => {
    await data[uri][acl.agent].delete(namedNode(agent))
  }, [uri])
  const [{isOver}, drop] = useDrop({
    accept: "agent",
    drop: async ({draggedAgentWebId, draggedPermissionsType, deleteDraggedAgentFromCurrent}) => {
      if (type !== draggedPermissionsType) {
        await Promise.all([
          deleteDraggedAgentFromCurrent(),
          addAgent(draggedAgentWebId)
        ])
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver()
    })
  })
  const classes = useStyles({draggedOver: isOver})
  return (
    <Box className={classes.permissionsType} ref={drop}>
      <Typography variant="h6">
        <ModeDescription type={type}/>
      </Typography>
      <Box className={classes.agents}>
        {agents && agents.map(agent => (
          <Agent agent={agent.value} readOnlyAcl={readOnly}
                 permissionsType={type}
                 deleteAgent={() => deleteAgent(agent.value)}
                 key={agent}/>
        ))}
        {!readOnly && (
          <IconButton  onClick={() => setAdding(true)} size="small">
            <Add/>
          </IconButton>
        )}
        {adding && (
          <Autocomplete options={friends}
                        getOptionLabel={friend => friend.value}
                        onChange={(e, friend) => {
                          addAgent(friend.value)
                          setAdding(false)
                        }}
                        renderInput={params => <TextField {...params} label="Who?" variant="outlined" />}
            />
        )}
      </Box>
    </Box>
  )
}

const PageName = ({page}) => {
  const name = useLDflexValue(`[${page}][${schema.name}]`);
  return <>{name && name.value}</>
}

function NoAclContent({page, aclUri}){
  const webId = useWebId()
  const {uri: parentAclUri, loading} = useParentAcl(page)
  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <DialogContent>
          <DialogContentText>
            This page is using the permissions of&nbsp;
            {parentAclUri && (
              <PageName page={`${parentAclUri.split(".").slice(0, -1).join(".")}index.ttl`}/>
            )}
          </DialogContentText>
          <PermissionsType aclUri={parentAclUri} type="Owners" readOnly/>
          <PermissionsType aclUri={parentAclUri} type="Writers" readOnly/>
          <PermissionsType aclUri={parentAclUri} type="Readers" readOnly/>
          <Button onClick={() => {
            createDefaultAcl(webId, aclUri.split(".").slice(0, -1).join("."))
          }}>
            customize permissions for <PageName page={page}/>
          </Button>
        </DialogContent>
      )}
    </>

  )
}

function AclContent({page, aclUri}){
  const name = useLDflexValue(`[${page}][${schema.name}]`);
  const url = sharingUrl(page)
  const classes = useStyles();
  return (
    <DialogContent>
      <DialogContentText>
        Set sharing for {name && name.toString()}
      </DialogContentText>
      <DialogContentText>
        Sharing link:
      </DialogContentText>
      <DialogContentText className={classes.sharingLink}>
        <IconButton onClick={() => copy(url)} title="copy link to clipboard">
          <CopyIcon size="small"/>
        </IconButton>
        <Link href={url} className={classes.pageLink}>{url}</Link>
      </DialogContentText>
      <PermissionsType aclUri={aclUri} type="Owners"/>
      <PermissionsType aclUri={aclUri} type="Writers"/>
      <PermissionsType aclUri={aclUri} type="Readers"/>
    </DialogContent>
  )
}

export default function SharingModal({page, aclUri, open, onClose}) {
  const {exists, loading} = useAclExists(aclUri)
  const classes = useStyles();
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle disableTypography>
        <Typography variant="h4">
          Sharing
        </Typography>
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      {(!exists && loading) ? (
          <Loader/>
        ) : (
          exists ? (
            <AclContent page={page} aclUri={aclUri}/>
          ) : (
            <NoAclContent page={page} aclUri={aclUri}/>
          )
        )}
    </Dialog>
  )
}

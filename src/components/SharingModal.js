import React, {useState, useCallback} from 'react';

import {useWebId} from '@solid/react';
import data from '@solid/query-ldflex';
import {namedNode} from '@rdfjs/data-model';

import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Autocomplete from '@material-ui/lab/Autocomplete';

import Close from '@material-ui/icons/Close';
import Add from '@material-ui/icons/Add';
import Loader from './Loader';
import { schema, foaf, acl } from 'rdf-namespaces';

import { useLDflexValue, useLDflexList } from '../hooks/ldflex';
import { useAclExists, useParentAcl } from '../hooks/acls';
import { createDefaultAcl } from '../utils/acl';

const useStyles = makeStyles(theme => ({
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  }
}));

const Agent = ({agent, onRemove}) => {
  const webId = useWebId();
  return (
    <div>
      {agent}
      {(agent !== webId) && <Close onClick={onRemove}/>}
    </div>
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
  return (
    <Box>
      <ModeDescription type={type}/>
      {readOnly ? undefined : (
        <IconButton  onClick={() => setAdding(true)} size="small">
          <Add/>
        </IconButton>
      )}
      {agents && agents.map(agent => (
        <Agent agent={agent.value} onRemove={() => deleteAgent(agent.value)} key={agent}/>
      ))}
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
        <>
          <DialogContentText>
            This page is using the permissions of&nbsp;
            {parentAclUri && (
              <PageName page={`${parentAclUri.split(".").slice(0, -1).join(".")}index.ttl`}/>
            )}
          </DialogContentText>
          <Button onClick={() => {
            createDefaultAcl(webId, aclUri.split(".").slice(0, -1).join("."))
          }}>
            create custom acl
          </Button>

          <PermissionsType aclUri={parentAclUri} type="Owners" readOnly/>
          <PermissionsType aclUri={parentAclUri} type="Writers" readOnly/>
          <PermissionsType aclUri={parentAclUri} type="Readers" readOnly/>
        </>
      )}
    </>

  )
}

export default function SharingModal({page, aclUri, open, onClose}) {
  const name = useLDflexValue(`[${page}][${schema.name}]`);
  const {exists, loading} = useAclExists(aclUri)
  const classes = useStyles();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        Sharing
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Loader/>
        ) : (
          exists ? (
            <>
              <DialogContentText>
                Set sharing for {name && name.toString()}
              </DialogContentText>
              <PermissionsType aclUri={aclUri} type="Owners"/>
              <PermissionsType aclUri={aclUri} type="Writers"/>
              <PermissionsType aclUri={aclUri} type="Readers"/>
            </>
          ) : (
            <NoAclContent page={page} aclUri={aclUri}/>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}

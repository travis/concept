import React, {useState, useCallback} from 'react';

import {useWebId} from '@solid/react';
import data from '@solid/query-ldflex';
import {namedNode} from '@rdfjs/data-model';

import { makeStyles } from '@material-ui/core/styles';
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

import { schema, foaf, acl } from 'rdf-namespaces';

import { useLDflex, useLDflexList } from '../hooks/ldflex';

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
  if (type === "ReadWriteControl") {
    return "Managers"
  } else if (type === "ReadWrite") {
    return "Editors"
  } else if (type === "Read") {
    return "Viewers"
  } else {
    return "Custom Permissions"
  }
}

const PermissionsType = ({ aclUri, type }) => {
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
      <Add onClick={() => setAdding(true)}/>
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

export default function SharingModal({page, aclUri, open, onClose}) {
  const [name] = useLDflex(`[${page}][${schema.name}]`);
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
        <DialogContentText>
          Set sharing for {name && name.toString()}
        </DialogContentText>
        <PermissionsType aclUri={aclUri} type="Read"/>
        <PermissionsType aclUri={aclUri} type="ReadWrite"/>
        <PermissionsType aclUri={aclUri} type="ControlReadWrite"/>
      </DialogContent>
    </Dialog>
  )
}

import React, {useState, useCallback} from 'react';

import {useWebId} from '@solid/react';
import data from '@solid/query-ldflex';
import {namedNode} from '@rdfjs/data-model';

import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
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
    <Modal
      aria-labelledby="sharing-modal-title"
      aria-describedby="sharing-modal-description"
      open={open}
      onClose={onClose}
    >
      <div className={classes.paper}>
        <h2 id="sharing-modal-title">Sharing</h2>
        <p id="sharing-modal-description">
          Set sharing for {name && name.toString()}
        </p>
        <PermissionsType aclUri={aclUri} type="Read"/>
        <PermissionsType aclUri={aclUri} type="ReadWrite"/>
        <PermissionsType aclUri={aclUri} type="ReadWriteControl"/>
      </div>
    </Modal>
  )
}

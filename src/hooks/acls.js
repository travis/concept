import solid from 'solid-auth-client';
import {useState, useEffect} from 'react';
import { useLiveUpdate } from '@solid/react';
import { getAccessInfo, getParentACLUri } from "../utils/acl"

export function useAccessInfo(documentUri){
  const [error, setError] = useState(undefined);
  const [accessInfo, setAccessInfo] = useState({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (documentUri){
      async function fetchUri() {
        setLoading(true)
        try {
          setAccessInfo(await getAccessInfo(documentUri))
        } catch(e){
          setError(e)
        }
        setLoading(false)
      }
      fetchUri()
    }
  }, [documentUri])
  return {loading, error, ...accessInfo}
}

export function useAclExists(aclUri){
  const [error, setError] = useState(undefined);
  const [exists, setExists] = useState({});
  const [loading, setLoading] = useState(false);
  const {timestamp, url} = useLiveUpdate()
  const [thisTimestamp, setThisTimestamp] = useState(timestamp)
  if ((timestamp !== thisTimestamp) && (url === aclUri)){
    setThisTimestamp(timestamp)
  }
  useEffect(() => {
    if (aclUri){
      async function fetchUri() {
        setLoading(true)
        try {
          const response = await solid.fetch(aclUri, { method: 'HEAD' })
          setExists(response.ok)
        } catch(e){
          setError(e)
        }
        setLoading(false)
      }
      fetchUri()
    }
  }, [aclUri, timestamp])
  return {loading, error, exists}
}

export function useParentAcl(pageUri){
  const [error, setError] = useState();
  const [aclUri, setAclUri] = useState();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (pageUri){
      async function fetchUri() {
        setLoading(true)
        try {
          setAclUri(await getParentACLUri(pageUri))
        } catch(e){
          setError(e)
        }
        setLoading(false)
      }
      fetchUri()
    }
  }, [pageUri])
  return {loading, error, uri: aclUri}
}

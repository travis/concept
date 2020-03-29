import solid from 'solid-auth-client';
import { useState, useEffect } from 'react';
import { useLiveUpdate } from '@solid/react';
import { getAccessInfo, getParentACLUri, AccessInfo } from "../utils/acl"

export function useAccessInfo(documentUri: string) {
  const [error, setError] = useState(undefined);
  const [accessInfo, setAccessInfo] = useState<AccessInfo>({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (documentUri) {
      const fetchUri = async () => {
        setLoading(true)
        try {
          setAccessInfo(await getAccessInfo(documentUri))
        } catch (e) {
          setError(e)
        }
        setLoading(false)
      }
      fetchUri()
    }
  }, [documentUri])
  return { loading, error, ...accessInfo }
}

export function useAclExists(aclUri: string) {
  const [error, setError] = useState(undefined);
  const [exists, setExists] = useState({});
  const [loading, setLoading] = useState(false);
  const { timestamp, url } = useLiveUpdate()
  const [thisTimestamp, setThisTimestamp] = useState(timestamp)
  if ((timestamp !== thisTimestamp) && (url === aclUri)) {
    setThisTimestamp(timestamp)
  }
  useEffect(() => {
    if (aclUri) {
      const fetchUri = async () => {
        setLoading(true)
        try {
          const response = await solid.fetch(aclUri, { method: 'HEAD' })
          setExists(response.ok)
        } catch (e) {
          setError(e)
        }
        setLoading(false)
      }
      fetchUri()
    }
  }, [aclUri, timestamp])
  return { loading, error, exists }
}

export function useParentAcl(pageUri: string) {
  const [error, setError] = useState();
  const [aclUri, setAclUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (pageUri) {
      const fetchUri = async () => {
        setLoading(true)
        try {
          setAclUri(await getParentACLUri(pageUri))
        } catch (e) {
          setError(e)
        }
        setLoading(false)
      }
      fetchUri()
    }
  }, [pageUri])
  return { loading, error, uri: aclUri }
}

import { useWebId } from "@solid/react";
import {useState, useEffect} from 'react';
import { getAccessInfo } from "../utils/acl"

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

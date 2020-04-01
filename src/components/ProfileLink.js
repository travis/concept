import React from 'react'
import { foaf } from 'rdf-namespaces';
import { useLDflexValue } from '../hooks/ldflex';
import { handleHausUriForWebId, handleProfilePath, webIdProfilePath } from '../utils/urls'
import Link from './Link'

export default function ProfileLink({ webId, children, ...props }) {
  const handleTerm = useLDflexValue(`[${handleHausUriForWebId(webId)}][${foaf.nick}]`)
  const handle = handleTerm && handleTerm.value
  const profilePath = handle ? handleProfilePath(handle) : webIdProfilePath(webId)
  return (
    <Link to={profilePath} {...props} >
      {children}
    </Link>
  )
}

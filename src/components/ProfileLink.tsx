import React, { FunctionComponent } from 'react'
import { foaf } from 'rdf-namespaces';
import { useValueQuery } from '../hooks/data';
import { handleHausUriForWebId, handleProfilePath, webIdProfilePath } from '../utils/urls'
import Link, { LinkProps } from './Link'


type ProfileLinkProps = { webId: string | undefined } & LinkProps

const ProfileLink: FunctionComponent<ProfileLinkProps> = ({ webId, ...props }) => {
  const [handle] = useValueQuery(webId && handleHausUriForWebId(webId), foaf.nick)
  const profilePath = handle ? handleProfilePath(handle) : webId ? webIdProfilePath(webId) : ""
  return (
    <Link to={profilePath} {...props} />
  )
}

export default ProfileLink

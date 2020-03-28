import solid from 'solid-auth-client';
import {parse as parseWAC} from 'wac-allow'

export async function getAccessInfo(pageUri){
  try {
    const response = await solid.fetch(pageUri, { method: 'HEAD' });
    const allowed = parseWAC(response.headers.get('WAC-Allow'))
    // for concept, acls are stored at the container level to ensure subpages inherit permissions by default
    const aclUri = `${pageUri.split("/").slice(0, -1).join("/")}/.acl`
    return {aclUri, allowed}
  } catch (error) {
    throw error;
  }
};

export const defaultAcl = (webId, container) => `@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix n: <http://www.w3.org/2006/vcard/ns#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix : <${container}.acl#>.

:Owners a acl:Authorization;
    acl:accessTo <${container}>;
    acl:default <${container}>;
    acl:agent <${webId}>;
    acl:mode acl:Read, acl:Write, acl:Control.
:Writers a acl:Authorization;
    acl:accessTo <${container}>;
    acl:default <${container}>;
    acl:mode acl:Read, acl:Write.
:Readers a acl:Authorization;
    acl:accessTo <${container}>;
    acl:default <${container}>;
    acl:mode acl:Read.
`

export const createDefaultAcl = (webId, container) => solid.fetch(`${container}.acl`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'text/turtle'
  },
  body: defaultAcl(webId, container)
})

// thanks, https://github.com/inrupt/solid-react-components/blob/develop/src/lib/classes/access-control-list.js
export const getParentACLUri = async (url) => {
  const newURL = new URL(url);
  const { pathname } = newURL;
  const hasParent = pathname.length > 1;
  if (!hasParent) return null;
  const isContainer = pathname.endsWith('/');
  let newPathname = isContainer ? pathname.slice(0, pathname.length - 1) : pathname;
  newPathname = `${newPathname.slice(0, newPathname.lastIndexOf('/'))}/`;
  const parentURI = `${newURL.origin}${newPathname}`;
  const result = await solid.fetch(`${parentURI}.acl`, { method: "HEAD" });
  if (result.status === 404) return getParentACLUri(parentURI);
  if (result.status === 200) return `${parentURI}.acl`;

  return null;
};

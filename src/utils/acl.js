import solid from 'solid-auth-client';
import parseLink from 'parse-link-header';
import {parse as parseWAC} from 'wac-allow'

export async function getAccessInfo(documentUri){
  try {
    const response = await solid.fetch(documentUri, { method: 'HEAD' });
    const parsedLinks = parseLink(response.headers.get('Link'));
    const aclUri = parsedLinks.acl ? new URL(parsedLinks.acl.url, documentUri).href : null;
    const allowed = parseWAC(response.headers.get('WAC-Allow'))
    return {aclUri, allowed}
  } catch (error) {
    throw error;
  }
};

import data from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import { acl, schema } from 'rdf-namespaces';

export const addPublicPage = (publicPageListUri, page) =>
  data[publicPageListUri][schema.itemListElement].add(namedNode(page))

export const removePublicPage = (publicPageListUri, page) =>
  data[publicPageListUri][schema.itemListElement].delete(namedNode(page))

export const addPublicAccess = (publicAccessUri, accessType) =>
  data[publicAccessUri][acl.mode].add(namedNode(acl[accessType]))

export const removePublicAccess = (publicAccessUri, accessType) =>
  data[publicAccessUri][acl.mode].delete(namedNode(acl[accessType]))

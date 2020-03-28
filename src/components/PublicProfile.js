import React from 'react'
import Typography from '@material-ui/core/Typography';
import { space, schema, vcard } from 'rdf-namespaces';
import { useParams } from "react-router-dom";

import Loader from "./Loader";

import { useLDflexValue, useLDflexList } from '../hooks/ldflex';
import { conceptContainerUrl, publicPagesUrl } from '../utils/urls';

function PublicPages({url}){
  const pages = useLDflexList(`[${url}][${schema.itemListElement}]`);
  return (
    <>
      {pages && pages.map(page => (
        <div key={page.value}>{page.value}</div>
      ))}
    </>
  )
}

function PublicInfo({webId}){
  const name = useLDflexValue(`[${webId}][${vcard.fn}]`);
  const storage = useLDflexValue(`[${webId}][${space.storage}]`);
  const conceptContainer = storage && conceptContainerUrl(storage)
  const publicPages = conceptContainer && publicPagesUrl(conceptContainer)
  return (
    <>
      <Typography variant="h4">{name && name.value}</Typography>
      {publicPages && <PublicPages url={publicPages}/>}
    </>
  )
}

export default function PublicProfile(){
  const { handle } = useParams();
  const webId = useLDflexValue(`[https://handle.haus/handles/${handle}#Person][https://handle.haus/ontology#webId]`)
  console.log("webid", webId)
  return (
    <div>
      {webId ? (
        <PublicInfo webId={webId.value}/>
      ) : (
        <Loader/>
      )}
    </div>
  )
}

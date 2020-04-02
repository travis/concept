import React from 'react'

import { space, schema, vcard, foaf } from 'rdf-namespaces';
import { useParams } from "react-router-dom";
import { Follow, useWebId } from "@solid/react";

import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import { useLDflexValue, useLDflexList } from '../hooks/ldflex';
import { conceptContainerUrl, publicPagesUrl } from '../utils/urls';
import { metaForPageUri } from '../utils/model'
import { pagePath } from '../utils/urls'

import Loader from "./Loader";
import Link from './Link'
import ProfileLink from './ProfileLink'

const useStyles = makeStyles(theme => ({
  profile: {
    padding: theme.spacing(2),
    height: "100%"
  },
  profileImage: {
    width: theme.spacing(10)
  },
  name: {
    textAlign: "left"
  },
  followButton: {
    ...theme.typography.button
  }
}));

function PublicPage({ pageUri }: { pageUri: string }) {
  const nameTerm = useLDflexValue(`from('${metaForPageUri(pageUri)}')[${pageUri}][${schema.name}]`);
  return (
    <ListItem>
      <Link to={pagePath(pageUri)} variant="h6">
        {nameTerm ? nameTerm.value : ""}
      </Link>
    </ListItem>
  )
}

function PublicPages({ url }: { url: string }) {
  const pageUriTerms = useLDflexList(`[${url}][${schema.itemListElement}]`);
  return (
    <List>
      <ListItem>
        <Typography variant="h5">
          Public Pages
            </Typography>
      </ListItem>
      {pageUriTerms && pageUriTerms.map((pageUriTerm: any) => (
        <PublicPage key={pageUriTerm.value} pageUri={pageUriTerm.value} />
      ))}
    </List>
  )
}

function Friend({ webId }: { webId: string }) {
  const nameTerm = useLDflexValue(`[${webId}][${vcard.fn}]`);
  return (
    <ListItem>
      <ProfileLink webId={webId} variant="h6">
        {nameTerm ? nameTerm.value : ""}
      </ProfileLink>
    </ListItem>
  )
}

function Friends({ webId }: { webId: string }) {
  const friendsTerms = useLDflexList(`[${webId}][${foaf.knows}]`);
  return (
    <List>
      <ListItem>
        <Typography variant="h5">
          Friends
            </Typography>
      </ListItem>
      {friendsTerms && friendsTerms.map((friendTerm: any) => (
        <Friend key={friendTerm.value} webId={friendTerm.value} />
      ))}
    </List>
  )
}

function FollowButton({ }) {
}

function PublicInfo({ webId }: { webId: string }) {
  const currentUserWebId = useWebId();
  const nameTerm = useLDflexValue(`[${webId}][${vcard.fn}]`);
  const name = nameTerm && nameTerm.value
  const photo = useLDflexValue(`[${webId}][${vcard.hasPhoto}]`);
  const storage = useLDflexValue(`[${webId}][${space.storage}]`);
  const conceptContainer = storage && conceptContainerUrl(storage)
  const publicPages = conceptContainer && publicPagesUrl(conceptContainer)
  const classes = useStyles()
  return (
    <>
      <Grid container alignItems="center" justify="flex-start">
        <Grid item xs={3}>
          {photo && <img src={photo} alt={`${name} 's profile`} className={classes.profileImage} />}
        </Grid >
        <Grid item xs={6}>
          <Typography variant="h4" className={classes.name}>
            {name}
          </Typography>
        </Grid>
        <Grid item xs={3}>
          {(webId !== currentUserWebId) && (
            <Button component={Follow} object={webId} className={classes.followButton}
              activateLabel={name ? `Follow ${name}` : ""}
              deactivateLabel={name ? `Unfollow ${name}` : ""}
            />
          )}
        </Grid>
      </Grid >
      <Grid container>
        <Grid item xs={6}>
          <Friends webId={webId} />
        </Grid>
        <Grid item xs={6}>
          {publicPages && <PublicPages url={publicPages} />}
        </Grid>
      </Grid>
    </>
  )
}

export function WebIdPublicProfile({ webId }: { webId: string }) {
  const classes = useStyles()

  return (
    <Paper className={classes.profile}>
      {webId ? (
        <PublicInfo webId={webId} />
      ) : (
          <Loader />
        )}
    </Paper>
  )
}

export function EncodedWebIdPublicProfile() {
  const { encodedWebId } = useParams()
  if (encodedWebId) {
    return (
      <WebIdPublicProfile webId={decodeURIComponent(encodedWebId)} />
    )
  } else {

  }
}



export default function PublicProfile() {
  const { handle } = useParams();
  const webId = useLDflexValue(`[https://handle.haus/handles/${handle}#Person][https://handle.haus/ontology#webId]`)
  return (
    <WebIdPublicProfile webId={webId && webId.value} />
  )
}

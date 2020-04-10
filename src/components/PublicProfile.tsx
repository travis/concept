import React from 'react'

import { space, schema, vcard, foaf } from 'rdf-namespaces';
import { useParams } from "react-router-dom";
import { useWebId, LiveUpdate } from "@solid/react";

import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import { useListValuesQuery, useListQuery, useValueQuery } from '../hooks/data';
import { follow, unfollow } from '../utils/data';
import { conceptContainerUrl, publicPagesUrl } from '../utils/urls';
import { metaForPageUri } from '../utils/model'
import { pagePath } from '../utils/urls'

import Loader, { ButtonLoader } from "./Loader";
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
  const [name] = useValueQuery(pageUri, schema.name, { source: pageUri && metaForPageUri(pageUri) })
  return (
    <ListItem>
      <Link to={pagePath(pageUri)} variant="h6">
        {name || ""}
      </Link>
    </ListItem>
  )
}

function PublicPages({ url }: { url: string }) {
  const [pageUriTerms] = useListQuery(url, schema.itemListElement)
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
  const [name] = useValueQuery(webId, vcard.fn);
  return (
    <ListItem>
      <ProfileLink webId={webId} variant="h6">
        {name || ""}
      </ProfileLink>
    </ListItem>
  )
}

function Friends({ webId }: { webId: string }) {
  const [friends] = useListQuery(webId, foaf.knows)
  return (
    <List>
      <ListItem>
        <Typography variant="h5">
          Friends
        </Typography>
      </ListItem>
      {friends && friends.map((friend: any) => (
        <Friend key={friend} webId={friend} />
      ))}
    </List>
  )
}

function FollowButton({ webId }: { webId: string }) {
  const currentUserWebId = useWebId();
  const [knowsWebIds, knowsLoading] = useListValuesQuery(currentUserWebId, foaf.knows);
  const knows = knowsWebIds && knowsWebIds.includes(webId)
  const onFollow = async () => {
    await follow(currentUserWebId, webId)
  }
  const onUnfollow = async () => {
    await unfollow(currentUserWebId, webId)
  }
  return (
    <Button onClick={knows ? onUnfollow : onFollow}>
      {knowsLoading ? (
        <ButtonLoader />
      ) : (
          knows ? "Unfollow " : "Follow"
        )}
    </Button>
  )
}

function PublicInfo({ webId }: { webId: string }) {
  const currentUserWebId = useWebId();
  const [name] = useValueQuery(webId, vcard.fn);
  const [photo] = useValueQuery(webId, vcard.hasPhoto);
  const [storage] = useValueQuery(webId, space.storage);
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
          <LiveUpdate subscribe={[currentUserWebId]}>
            {webId && currentUserWebId && (webId !== currentUserWebId) && (
              <FollowButton webId={webId} />
            )}
          </LiveUpdate>
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
  const [webId] = useValueQuery(handle && `https://handle.haus/handles/${handle}#Person`, "https://handle.haus/ontology#webId")
  return (
    <WebIdPublicProfile webId={webId} />
  )
}

import React from 'react'

import Typography from '@material-ui/core/Typography';

import { LogInButton } from './LogInLogOutButton'
import { AppTitleGridRow, MottoGridRow } from './AppTitle'
import { Question, Answer, A } from './FAQ'

function LandingPage() {
  return (
    <>
      <AppTitleGridRow />
      <MottoGridRow/>
      <Question>
        What is this?
      </Question>
      <Answer>
        <Typography>
          Concept is a collaborative workspace for organizing the world. It's
          pretty simple for now, but <A href="https://github.com/travis/concept">with your help</A> we
          can make it the best workspace on the web.
        </Typography>
        <Typography>
          If you use Google Docs, Dropbox Paper or Notion but want to use an app that gives
          you full control over your data, help us make Concept the best of all
          possible collaboration tools.
        </Typography>
      </Answer>
      <Question>
        How can I get started?
      </Question>
      <Answer>
        <Typography>
          Concept is built on Solid, an emerging open web standard that puts you back in control of your data.
        </Typography>
        <Typography>
          To start using Concept you'll need to <A href="https://solidproject.org/use-solid/">create your Pod</A> and
          then <LogInButton>log in</LogInButton> to Concept using your WebId.
        </Typography>
      </Answer>

    </>
  )
}

export default LandingPage

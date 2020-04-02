import React from 'react'

import Typography from '@material-ui/core/Typography';

import { LogInButton } from './LogInLogOutButton'
import { AppTitleGridRow, MottoGridRow } from './AppTitle'
import { Question, Answer, A } from './FAQ'
import SocialIcons from './SocialIcons'

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
      <Question>
        Is my data safe?
      </Question>
      <Answer>
        <Typography>
          You're trusting your Pod provider with your data, so ultimately it's
          as safe as you think your Pod provider makes it.
        </Typography>
        <Typography>
          Concept is in Alpha at the moment, which means we might make
          non-backwards-compatible changes to the data model. We can't promise
          to support migration between different data formats for now. We're
          hoping to move to Beta soon, at which point we'll provide better
          support.
        </Typography>
        <Typography>
          Your data will always be accessible via your Pod provider's data
          browser, and we create backups of your active documents every 1, 5 and
          10 minutes while you're editing. You definitely won't lose data as
          long as as your Pod provider doesn't lose data, it might just require
          expert-level skills to get your data back for now.
        </Typography>
      </Answer>
      <Question>
        Something went wrong! How do I get help?
      </Question>
      <Answer>
        <Typography>
          For now, please file bug reports in the <A href="https://github.com/travis/concept/issues">issue tracker on GitHub.</A>
        </Typography>
      </Answer>
      <SocialIcons />
    </>
  )
}

export default LandingPage

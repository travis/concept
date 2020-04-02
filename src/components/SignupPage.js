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
        How can I sign up?
      </Question>
      <Answer>
        <Typography>
          Concept doesn't store your data. It's a new kind of app built on an emerging web standard called <A href="https://solidproject.org/">Solid</A>.
        </Typography>
        <Typography>
          When you use a Solid app, you bring your own data, stored in your
          personal data <A href="https://solidproject.org/faqs#pod">Pod</A>.
        </Typography>
        <Typography>
          To use Concept, first <A href="https://solidproject.org/use-solid/">pick a provider and create your Pod</A>.
        </Typography>
        <Typography>
          Once you've created your Pod, <LogInButton>log in</LogInButton> to Concept to get started organizing your world.

        </Typography>
      </Answer>
    </>
  )
}

export default LandingPage

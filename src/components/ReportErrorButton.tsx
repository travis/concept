import React, { FunctionComponent } from 'react'
import Button from '@material-ui/core/Button';
import * as Sentry from '@sentry/browser';

type ErrorButtonProps = {
  eventId: string | undefined
}
const ReportErrorButton: FunctionComponent<ErrorButtonProps> = ({ eventId }) => {
  return (
    <Button onClick={() => Sentry.showReportDialog({ eventId })}>Tell Us About It</Button>
  )
}

export default ReportErrorButton

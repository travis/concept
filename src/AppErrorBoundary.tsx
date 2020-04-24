import React, { ReactNode } from 'react';
import * as Sentry from '@sentry/browser';
import Button from '@material-ui/core/Button';
import { withSnackbar, ProviderContext } from 'notistack';

import UnrecoverableErrorPage from './components/UnrecoverableErrorPage';

type AppErrorBoundaryProps = { children: ReactNode } & ProviderContext
type AppErrorBoundaryState = {
  hasError: boolean, eventId: string | undefined, error: any,
  snackbarOpen: boolean, lastErrorTime: number | null,
  possibleInfiniteLoop: boolean
}

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state = {
    eventId: undefined, error: null, hasError: false,
    snackbarOpen: false, lastErrorTime: null,
    possibleInfiniteLoop: false
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true, error
    }
  };

  componentDidCatch(error: any, errorInfo: any) {
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo);
      const eventId = Sentry.captureException(error);
      const now = Date.now()
      const lastErrorTime = this.state.lastErrorTime
      const possibleInfiniteLoop = (!!lastErrorTime && ((now - lastErrorTime) < 500))
      this.setState({
        eventId, lastErrorTime: now,
        possibleInfiniteLoop
      });
      this.props.enqueueSnackbar("Oh no - we caught an error!", {
        variant: "error",
        action: <Button onClick={() => Sentry.showReportDialog({ eventId })}>Tell Us About It</Button>
      })
    });
  }

  handleClose() {
    this.setState({ hasError: false, snackbarOpen: false })
  }

  render() {
    if (this.state.possibleInfiniteLoop) {
      return <UnrecoverableErrorPage eventId={this.state.eventId} />
    } else {
      return this.props.children
    }
  }
}

export default withSnackbar(AppErrorBoundary)

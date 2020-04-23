import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import './i18n'
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: "https://2837c0eb80034804b6315f25c0a0e519@o382054.ingest.sentry.io/5211463",
  environment: process.env.NODE_ENV,
  release: `concept@${process.env.REACT_APP_VERSION}`,
  beforeSend(event, hint) {
    // Check if it is an exception, and if so, show the report dialog
    if (event.exception) {
      Sentry.showReportDialog({ eventId: event.event_id });
    }
    return event;
  }
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

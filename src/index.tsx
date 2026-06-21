import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { initSentry, Sentry } from './Utilities/sentry';
import { registerServiceWorker } from './Utilities/registerServiceWorker';
import ErrorFallback from './Components/ErrorFallback';

initSentry();
registerServiceWorker();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <Sentry.ErrorBoundary fallback={({ error, resetError }) => <ErrorFallback error={error} resetError={resetError} />}>
    <App />
  </Sentry.ErrorBoundary>
);

reportWebVitals();

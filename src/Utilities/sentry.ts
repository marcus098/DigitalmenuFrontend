import * as Sentry from '@sentry/react';

// Categories: errors run under "legitimate interest" with PII scrubbed.
// Session Replay & performance traces require explicit analytics consent.

const CONSENT_KEY = 'cookieConsent';

type StoredConsent = {
    version: number;
    state: { analytics: boolean; functional: boolean; marketing: boolean };
};

const readAnalyticsConsent = (): boolean => {
    try {
        const raw = localStorage.getItem(CONSENT_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as StoredConsent;
        return parsed?.state?.analytics === true;
    } catch {
        return false;
    }
};

let replayIntegration: ReturnType<typeof Sentry.replayIntegration> | null = null;

export const initSentry = (): void => {
    const dsn = process.env.REACT_APP_SENTRY_DSN;
    if (!dsn) return;

    const environment = process.env.REACT_APP_SENTRY_ENV ?? process.env.NODE_ENV ?? 'development';
    const release = process.env.REACT_APP_SENTRY_RELEASE;
    const analyticsConsent = readAnalyticsConsent();

    replayIntegration = Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
    });

    Sentry.init({
        dsn,
        environment,
        release,
        sendDefaultPii: false,
        // Error reporting is always on; performance/replay only after consent.
        tracesSampleRate: analyticsConsent ? 0.1 : 0,
        replaysSessionSampleRate: analyticsConsent ? 0.05 : 0,
        replaysOnErrorSampleRate: analyticsConsent ? 1.0 : 0,
        integrations: [
            Sentry.browserTracingIntegration(),
            replayIntegration,
        ],
        beforeSend(event) {
            // Strip IP and user-agent fingerprint when no consent.
            if (!readAnalyticsConsent()) {
                if (event.user) {
                    delete event.user.ip_address;
                    delete event.user.email;
                }
                if (event.request?.headers) {
                    delete event.request.headers['User-Agent'];
                    delete event.request.headers['user-agent'];
                }
            }
            return event;
        },
    });

    // React to consent changes broadcast by CookieConsentContext.
    window.addEventListener('cookieconsent:change', (evt) => {
        const detail = (evt as CustomEvent).detail as { analytics?: boolean } | undefined;
        const analytics = !!detail?.analytics;
        const client = Sentry.getClient();
        if (!client) return;
        const options = client.getOptions();
        options.tracesSampleRate = analytics ? 0.1 : 0;
        if (replayIntegration) {
            if (analytics) replayIntegration.start();
            else replayIntegration.stop();
        }
    });
};

export { Sentry };

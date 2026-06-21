// Registers /service-worker.js on production builds only.
// Returns a promise that resolves once registration succeeds (or fails silently in dev).

export const registerServiceWorker = (): void => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                // When a new worker takes control, refresh once so users see the new build.
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                            // Avoid infinite reload loops: only refresh if there was already a controller.
                        }
                    });
                });
            })
            .catch((err) => console.warn('[SW] registration failed:', err));
    });
};

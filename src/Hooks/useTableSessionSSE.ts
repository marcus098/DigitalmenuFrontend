import { useEffect, useRef } from 'react';
import { TableSessionState } from '../types';
import { getTableSessionStateApi } from '../Utilities/api';

const MAX_RETRIES = 5;
const POLLING_INTERVAL_MS = 15000;

export function useTableSessionSSE(
    sessionId: string | null,
    clientSessionId: string,
    onState: (s: TableSessionState) => void,
    onSubmitted?: () => void,
    onClosed?: () => void
): void {
    const esRef = useRef<EventSource | null>(null);
    const retryRef = useRef<number>(0);
    const retryTimerRef = useRef<number | null>(null);
    const pollingRef = useRef<number | null>(null);
    const cancelledRef = useRef<boolean>(false);

    // Stable handler refs to avoid resubscribing on each render
    const onStateRef = useRef(onState);
    const onSubmittedRef = useRef(onSubmitted);
    const onClosedRef = useRef(onClosed);

    useEffect(() => {
        onStateRef.current = onState;
        onSubmittedRef.current = onSubmitted;
        onClosedRef.current = onClosed;
    }, [onState, onSubmitted, onClosed]);

    useEffect(() => {
        if (!sessionId || !clientSessionId) return;
        cancelledRef.current = false;
        retryRef.current = 0;

        const apiBase = process.env.REACT_APP_BACKEND_WEBFLUX_URL_BASE ?? process.env.REACT_APP_BACKEND_URL_BASE ?? '';

        const cleanupEs = () => {
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
        };

        const scheduleReconnect = () => {
            if (cancelledRef.current) return;
            if (retryRef.current >= MAX_RETRIES) return;
            const delay = Math.min(30000, 1000 * Math.pow(2, retryRef.current));
            retryRef.current += 1;
            retryTimerRef.current = window.setTimeout(connect, delay);
        };

        const pollOnce = async () => {
            const result = await getTableSessionStateApi(sessionId, clientSessionId);
            if (result.success && result.data && !('error' in (result.data as object))) {
                onStateRef.current(result.data as TableSessionState);
            }
        };

        const connect = () => {
            if (cancelledRef.current) return;
            cleanupEs();
            const url = `${apiBase}/api/public/sessions/${sessionId}/sse?clientSessionId=${encodeURIComponent(clientSessionId)}`;
            const es = new EventSource(url);
            esRef.current = es;

            es.onopen = () => {
                retryRef.current = 0;
            };

            // Backend emits minimal payload {sessionId, type} — refetch full state on any event
            es.addEventListener('state', () => {
                pollOnce();
            });

            es.addEventListener('submitted', () => {
                pollOnce();
                onSubmittedRef.current?.();
            });

            es.addEventListener('closed', () => {
                pollOnce();
                onClosedRef.current?.();
            });

            es.onerror = () => {
                cleanupEs();
                scheduleReconnect();
            };
        };

        // Initial fetch + connection
        pollOnce();
        connect();

        // Polling fallback
        pollingRef.current = window.setInterval(pollOnce, POLLING_INTERVAL_MS);

        return () => {
            cancelledRef.current = true;
            cleanupEs();
            if (retryTimerRef.current !== null) {
                window.clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
            if (pollingRef.current !== null) {
                window.clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [sessionId, clientSessionId]);
}

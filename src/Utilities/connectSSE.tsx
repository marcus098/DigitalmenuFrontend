import { useEffect, useState } from 'react';

export const connectSSE = (
    endpoint: string,
    onMessage: (data: any) => void,
    onError?: (error: any) => void
): EventSource => {
    const eventSource = new EventSource(endpoint);

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
    };

    eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        if (onError) {
            onError(error);
        }
        eventSource.close(); // Chiude la connessione in caso di errore
    };

    return eventSource;
};

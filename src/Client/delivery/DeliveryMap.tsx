import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Mappa Leaflet con pin trascinabile (tile OpenStreetMap con attribuzione).
 * Caricata con React.lazy dal checkout domicilio: Leaflet non entra nel bundle del menu.
 */
export interface DeliveryMapProps {
    lat: number;
    lng: number;
    /** punto di partenza del locale (cerchio discreto) */
    origin?: { lat: number; lng: number } | null;
    /** raggio massimo di consegna in km (cerchio tratteggiato) */
    maxKm?: number;
    onMove: (lat: number, lng: number) => void;
    label: string;
    pinLabel: string;
}

const pinIcon = L.divIcon({
    className: 'rf-delivery-pin',
    html: `<svg width="36" height="48" viewBox="0 0 36 48" aria-hidden="true"><path d="M18 0C8 0 0 8 0 18c0 13 18 30 18 30s18-17 18-30C36 8 28 0 18 0z" fill="var(--menu-accent, #f97316)" stroke="#fff" stroke-width="2"/><circle cx="18" cy="18" r="6.5" fill="#fff"/></svg>`,
    iconSize: [36, 48],
    iconAnchor: [18, 46],
});

const DeliveryMap: React.FC<DeliveryMapProps> = ({ lat, lng, origin, maxKm, onMove, label, pinLabel }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const onMoveRef = useRef(onMove);
    onMoveRef.current = onMove;

    useEffect(() => {
        if (!boxRef.current) return;
        const map = L.map(boxRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView([lat, lng], 17);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        }).addTo(map);
        if (origin) {
            L.circleMarker([origin.lat, origin.lng], { radius: 6, color: '#555', weight: 2, fillColor: '#fff', fillOpacity: 1, interactive: false }).addTo(map);
            if (maxKm && maxKm > 0) {
                L.circle([origin.lat, origin.lng], { radius: maxKm * 1000, color: '#888', weight: 1, dashArray: '6 6', fill: false, interactive: false }).addTo(map);
            }
        }
        const marker = L.marker([lat, lng], { draggable: true, icon: pinIcon, keyboard: true, title: pinLabel, alt: pinLabel, autoPan: true }).addTo(map);
        marker.on('dragend', () => {
            const p = marker.getLatLng();
            onMoveRef.current(p.lat, p.lng);
        });
        // tocco sulla mappa = sposta il pin lì (più comodo del trascinamento su telefono)
        map.on('click', (e: L.LeafletMouseEvent) => {
            marker.setLatLng(e.latlng);
            onMoveRef.current(e.latlng.lat, e.latlng.lng);
        });
        mapRef.current = map;
        markerRef.current = marker;
        // il contenitore può essere misurato dopo l'animazione d'ingresso
        const t = setTimeout(() => map.invalidateSize(), 250);
        return () => { clearTimeout(t); map.remove(); mapRef.current = null; markerRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // nuovo indirizzo da ricerca/posizione → sposta pin e vista
    useEffect(() => {
        const m = markerRef.current;
        const map = mapRef.current;
        if (!m || !map) return;
        const cur = m.getLatLng();
        if (Math.abs(cur.lat - lat) > 1e-7 || Math.abs(cur.lng - lng) > 1e-7) {
            m.setLatLng([lat, lng]);
            map.setView([lat, lng], Math.max(map.getZoom(), 16));
        }
    }, [lat, lng]);

    return (
        <div
            ref={boxRef}
            role="region"
            aria-label={label}
            className="w-full overflow-hidden"
            style={{ height: 260, borderRadius: 'var(--menu-radius)', border: '1px solid var(--menu-border)', zIndex: 0, position: 'relative' }}
        />
    );
};

export default DeliveryMap;

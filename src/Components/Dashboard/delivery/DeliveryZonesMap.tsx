import React, {useEffect, useRef, useState} from 'react';
import type * as Leaflet from 'leaflet';

/** Colori delle zone, dalla più vicina alla più lontana. */
export const ZONE_COLORS = ['#16a34a', '#f97316', '#8b5cf6', '#0ea5e9', '#e11d48', '#a16207'];

interface Props {
    /** Punto di partenza; null = mappa centrata sull'Italia, il pin compare al primo clic */
    origin: { lat: number, lng: number } | null
    /** Raggi delle zone in km (ordinati crescenti) */
    zonesKm: number[]
    onMove: (lat: number, lng: number) => void
    className?: string
}

const PIN_HTML = `
<div style="position:relative;width:34px;height:44px;transform:translate(-17px,-42px)">
  <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 43s14-14.6 14-26A14 14 0 0 0 3 17c0 11.4 14 26 14 26z" fill="#ea580c" stroke="#fff" stroke-width="2.5"/>
    <circle cx="17" cy="17" r="5.5" fill="#fff"/>
  </svg>
</div>`;

/**
 * Mappa Leaflet (caricata solo quando serve) con il punto di partenza trascinabile e le zone di consegna
 * come cerchi concentrici. Tile OpenStreetMap con attribuzione.
 */
const DeliveryZonesMap: React.FC<Props> = ({origin, zonesKm, onMove, className = ''}) => {
    const hostRef = useRef<HTMLDivElement>(null)
    const LRef = useRef<typeof Leaflet | null>(null)
    const mapRef = useRef<Leaflet.Map | null>(null)
    const markerRef = useRef<Leaflet.Marker | null>(null)
    const circlesRef = useRef<Leaflet.Circle[]>([])
    const onMoveRef = useRef(onMove)
    onMoveRef.current = onMove
    const [ready, setReady] = useState(false)
    const [failed, setFailed] = useState(false)

    // Caricamento pigro di Leaflet + CSS
    useEffect(() => {
        let cancelled = false
        Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
            .then(([mod]) => {
                if (cancelled || !hostRef.current) return
                const L = ((mod as any).default ?? mod) as typeof Leaflet
                LRef.current = L
                const map = L.map(hostRef.current, {scrollWheelZoom: false, zoomControl: true})
                    .setView(origin ? [origin.lat, origin.lng] : [42.5, 12.5], origin ? 13 : 5)
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
                }).addTo(map)
                // Clic sulla mappa: sposta il punto di partenza
                map.on('click', (e: Leaflet.LeafletMouseEvent) => onMoveRef.current(e.latlng.lat, e.latlng.lng))
                mapRef.current = map
                setReady(true)
            })
            .catch(() => !cancelled && setFailed(true))
        return () => {
            cancelled = true
            mapRef.current?.remove()
            mapRef.current = null
            markerRef.current = null
            circlesRef.current = []
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Pin + cerchi a ogni cambio di punto o zone
    useEffect(() => {
        const L = LRef.current, map = mapRef.current
        if (!ready || !L || !map) return
        circlesRef.current.forEach(c => c.remove())
        circlesRef.current = []
        if (!origin) {
            markerRef.current?.remove()
            markerRef.current = null
            return
        }
        const ll: Leaflet.LatLngExpression = [origin.lat, origin.lng]
        if (!markerRef.current) {
            const icon = L.divIcon({html: PIN_HTML, className: '', iconSize: [0, 0]})
            const marker = L.marker(ll, {draggable: true, icon, keyboard: true, title: 'Punto di partenza (trascinalo)'})
            marker.on('dragend', () => {
                const p = marker.getLatLng()
                onMoveRef.current(p.lat, p.lng)
            })
            marker.addTo(map)
            markerRef.current = marker
        } else {
            markerRef.current.setLatLng(ll)
        }
        // Dal più grande al più piccolo: i cerchi interni restano sopra e cliccabili
        const valid = zonesKm.map((km, i) => ({km, i})).filter(z => Number.isFinite(z.km) && z.km > 0)
        ;[...valid].sort((a, b) => b.km - a.km).forEach(({km, i}) => {
            const color = ZONE_COLORS[i % ZONE_COLORS.length]
            const circle = L.circle(ll, {
                radius: km * 1000, color, weight: 2, opacity: 0.9, fillColor: color, fillOpacity: 0.08, interactive: false,
            }).addTo(map)
            circlesRef.current.push(circle)
        })
        const biggest = circlesRef.current[0]
        if (biggest) map.fitBounds(biggest.getBounds(), {padding: [24, 24], maxZoom: 15})
        else map.setView(ll, Math.max(map.getZoom(), 14))
    }, [ready, origin?.lat, origin?.lng, zonesKm.join('|')])

    return (
        <div className={`relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 ${className}`}>
            <div ref={hostRef} className="absolute inset-0 z-0" data-testid="delivery-map"/>
            {!ready && !failed && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">Caricamento mappa…</div>
            )}
            {failed && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500 px-6 text-center">
                    Impossibile caricare la mappa. Controlla la connessione e ricarica la pagina.
                </div>
            )}
        </div>
    )
}

export default DeliveryZonesMap;

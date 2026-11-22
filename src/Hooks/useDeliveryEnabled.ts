import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicDeliverySettingsApi } from '../Utilities/api';

/** Evento lanciato dalla pagina impostazioni dopo il salvataggio (aggiorna la voce "Consegne" del menu). */
export const DELIVERY_SETTINGS_CHANGED = 'rf-delivery-settings-changed';

/**
 * true se il locale ha la consegna a domicilio attiva: serve a mostrare "Consegne" nella navigazione
 * di titolare e camerieri solo quando ha senso.
 */
export const useDeliveryEnabled = (active: boolean): boolean => {
    const { localname } = useParams();
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (!active || !localname) return;
        let cancelled = false;
        const load = () => getPublicDeliverySettingsApi(localname).then(r => {
            if (!cancelled) setEnabled(!!(r.success && r.data && (r.data as any).enabled));
        });
        load();
        const onChange = (e: Event) => {
            const detail = (e as CustomEvent<boolean | undefined>).detail;
            if (typeof detail === 'boolean') setEnabled(detail); else load();
        };
        window.addEventListener(DELIVERY_SETTINGS_CHANGED, onChange);
        return () => { cancelled = true; window.removeEventListener(DELIVERY_SETTINGS_CHANGED, onChange); };
    }, [active, localname]);

    return enabled;
};

import { useEffect, useState } from 'react';
import type { PublicDeliveryInfo } from '../Client/delivery/deliveryUtils';
import { getPublicDeliverySettingsApi } from '../Utilities/api';

/** Una richiesta per locale e per caricamento pagina: menu, carrello e checkout condividono il risultato. */
const cache = new Map<string, Promise<PublicDeliveryInfo | null>>();

const load = (localname: string) => {
    let p = cache.get(localname);
    if (!p) {
        p = getPublicDeliverySettingsApi(localname).then(r => (r.success && r.data ? r.data : null));
        // un errore di rete non resta in cache: al prossimo montaggio si riprova
        p.then(v => { if (!v) cache.delete(localname); });
        cache.set(localname, p);
    }
    return p;
};

/** Impostazioni pubbliche della consegna; `settings` null = consegna non attiva o non raggiungibile. */
const useDeliverySettings = (localname: string | undefined) => {
    const [settings, setSettings] = useState<PublicDeliveryInfo | null>(null);
    const [loading, setLoading] = useState(!!localname);

    useEffect(() => {
        if (!localname) { setLoading(false); return; }
        let cancelled = false;
        setLoading(true);
        load(localname).then(s => {
            if (cancelled) return;
            setSettings(s);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [localname]);

    return { settings, loading, deliveryEnabled: !!settings?.enabled && (settings.zones?.length ?? 0) > 0 };
};

export default useDeliverySettings;

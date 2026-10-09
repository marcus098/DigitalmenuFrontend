import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { useNotification } from '../../Context/NotificationContext';
import { reprintComandApi } from '../../Utilities/printApi';

type Props = {
    comandId: string;
    /** Stampante specifica; se assente ristampa su tutte le stampanti con prodotti della comanda. */
    printerId?: string;
    className?: string;
    compact?: boolean;
};

const ReprintButton: React.FC<Props> = ({ comandId, printerId, className, compact }) => {
    const { addNotification } = useNotification();
    const [busy, setBusy] = useState(false);

    const onClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (busy) return;
        setBusy(true);
        const res = await reprintComandApi(comandId, printerId);
        setBusy(false);
        if (res.success && res.data) {
            const n = res.data.enqueued;
            addNotification(n > 0
                ? { message: n === 1 ? 'Ristampa inviata' : `Ristampa inviata a ${n} stampanti`, type: 'success' }
                : { message: 'Nessuna stampante configurata per questa comanda', type: 'error' });
        } else {
            addNotification({ message: 'Errore ristampa comanda', type: 'error' });
        }
    };

    return (
        <button onClick={onClick} disabled={busy} title="Ristampa comanda"
                className={className ?? 'inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 hover:border-primary hover:text-primary rounded-md px-2.5 py-1.5 disabled:opacity-50'}>
            <Printer className="w-3.5 h-3.5" />
            {!compact && (busy ? 'Invio…' : 'Ristampa')}
        </button>
    );
};

export default ReprintButton;

import React from "react";
import {ComandHistoryEntry} from "../../ComandType";
import {historyText, historyTime} from "./orderEditing";

/** Storico della comanda (dal più vecchio): nascosto se vuoto. */
const OrderHistory: React.FC<{ history?: ComandHistoryEntry[] | null }> = ({history}) => {
    if (!history || history.length === 0) return null;
    return (
        <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="font-semibold text-sm text-gray-800 mb-2">Storico</h4>
            <ol className="space-y-1.5" data-testid="order-history">
                {history.map((e, i) => (
                    <li key={i} className="text-sm text-gray-700 leading-snug">
                        <span className="font-mono text-xs text-gray-500">{historyTime(e.at)}</span>
                        {e.by?.name && <span className="text-gray-500"> · {e.by.name}</span>}
                        <span> · {historyText(e)}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default OrderHistory;

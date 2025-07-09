import React from 'react';
import {FaBolt, FaChair, FaEdit, FaInfoCircle, FaLock, FaTrashAlt, FaUnlock} from 'react-icons/fa';
import {Table} from "../../Dashboard/Pages/TablesPageTest";

interface TableItemProps {
    table: Table;
    onInfo: (table: Table) => void;
    onEdit: (table: Table) => void;
    onRemove: (table: Table) => void;
    onFree: (table: Table) => void;
    onOccupy: (table: Table) => void;
    isSelected: boolean
    // Props che react-grid-layout passerà automaticamente
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

const TableItem: React.FC<TableItemProps> = React.forwardRef<HTMLDivElement, TableItemProps>(
    ({ table, onFree, onOccupy, onInfo, onEdit, onRemove, className, style, children, ...props }, ref) => {

        const statusClasses = {
            Libero: 'bg-green-100 border-2 border-green-500 text-green-800',
            Occupato: 'bg-red-100 border-2 border-red-500 text-red-800',
        };
        const currentStatus = table.busy ? "Occupato" : "Libero";

        return (
            // Usiamo ...props per passare qualsiasi prop extra che la libreria potrebbe usare
            <div
                ref={ref}
                className={`${className} ${statusClasses[currentStatus]} rounded-xl shadow-lg cursor-move flex flex-col p-2 overflow-hidden`}
                style={style}
                {...props}
            >
                {/* Contenuto della card */}
                <div className="flex flex-col justify-between h-full">
                    {/* Sezione Superiore */}
                    <div className="flex justify-between items-start w-full">
                        <span className="font-bold text-lg text-gray-800 truncate">{table.name}</span>

                        {/* Area non trascinabile per i bottoni */}
                        <div className="non-draggable flex items-center flex-shrink-0">
                            <button onClick={() => onInfo(table)} className="p-1.5 text-gray-500 hover:text-blue-500"><FaInfoCircle size={15}/></button>
                            <button onClick={() => onEdit(table)} className="p-1.5 text-gray-500 hover:text-primary"><FaEdit size={14}/></button>
                            {/*<button onClick={() => onRemove(table)} className="p-1.5 text-gray-500 hover:text-red-500"><FaTrashAlt size={14}/></button>*/}

                            {/* ---- NUOVI BOTTONI ---- */}
                            {table.busy ? (
                                <>
                                    <button onClick={() => onFree(table)}
                                            className="p-1.5 hover:text-green-600" title="Libera tavolo">
                                        <FaUnlock size={14}/>
                                    </button>
                                    {/*<button onClick={() => onForceFree(Number(table.id))}
                                            className="p-1.5 hover:text-orange-500" title="Forza libera tavolo">
                                        <FaBolt size={14}/>
                                    </button>*/}
                                </>
                            ) : (
                                <button onClick={() => onOccupy(table)}
                                        className="p-1.5 hover:text-red-600" title="Occupa tavolo">
                                    <FaLock size={14}/>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sezione Inferiore */}
                    <div className="flex justify-between items-end w-full">
                        {table.seats !== undefined && (
                            <div className="flex items-center gap-1.5 text-base font-bold">
                                <FaChair /><span>{table.seats}</span>
                            </div>
                        )}
                        <div className="text-xs font-bold uppercase tracking-wider">{currentStatus}</div>
                    </div>
                </div>

                {/* Maniglia di resize di RGL (deve rimanere) */}
                {children}
            </div>
        );
    }
);

export default TableItem;
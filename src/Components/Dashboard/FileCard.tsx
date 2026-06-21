import React, {useEffect, useRef, useState} from 'react';
import {FileDto} from "../../types";
import DeletePopup from "../DeletePopup";
import { FileText, Image, MoreVertical, Trash2, Pencil, Download } from "lucide-react";

// Funzione helper per le icone
const getFileIcon = (type: string) => {
    switch (type) {
        case 'pdf': return <FileText className="w-10 h-10 text-red-500" />;
        case 'image': return <Image className="w-10 h-10 text-blue-500" />;
        case 'jpg': return <Image className="w-10 h-10 text-blue-500" />;
        case 'jpeg': return <Image className="w-10 h-10 text-blue-500" />;
        case 'webp': return <Image className="w-10 h-10 text-blue-500" />;
        case 'png': return <Image className="w-10 h-10 text-blue-500" />;
        default: return <FileText className="w-10 h-10 text-gray-500" />;
    }
};

interface FileCardProps {
    file: FileDto;
    onDelete: (fileId: number) => void;
    onRename: (fileId: number, newName: string) => void;
    onDownload: (fileId: number) => void
}

export const FileCard: React.FC<FileCardProps> = ({ file, onDelete, onRename, onDownload }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(file.fileName);
    const [confirmPopup, setConfirmPopup] = useState<boolean>(false)

    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // --- LOGICA PER IL MENU E LA RINOMINA ---

    // Effetto per chiudere il menu se si clicca fuori
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Effetto per mettere a fuoco l'input quando si entra in modalità rinomina
    useEffect(() => {
        if (isRenaming) {
            inputRef.current?.focus();
        }
    }, [isRenaming]);

    const handleRenameClick = () => {
        setIsMenuOpen(false);
        setIsRenaming(true);
    };

    const handleRenameConfirm = () => {
        if (newName.trim() && newName !== file.fileName) {
            onRename(file.id, newName.trim());
        }
        setIsRenaming(false);
    };

    const handleDeleteClick = async () => {
        setIsMenuOpen(false);
        onDelete(file.id);
    };

    // Gestisce la pressione dei tasti Enter (salva) e Escape (annulla) durante la rinomina
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleRenameConfirm();
        } else if (e.key === 'Escape') {
            setNewName(file.fileName);
            setIsRenaming(false);
        }
    };

    const closePopup = () => {
        setConfirmPopup(false)
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 flex items-center gap-4 transition-all hover:shadow-xl hover:border-primary">
            {confirmPopup && <DeletePopup itemName={file.fileName} onConfirm={handleDeleteClick} onCancel={closePopup} />}
            <div className="flex-shrink-0">{getFileIcon(file.fileType)}</div>

            <div className="flex-grow overflow-hidden">
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRenameConfirm} // Salva anche quando si perde il focus
                        onKeyDown={handleKeyDown}
                        className="font-semibold text-gray-800 bg-blue-50 border border-primary rounded-md px-2 py-1 w-full"
                    />
                ) : (
                    <p className="font-semibold text-gray-800 truncate" title={file.fileName}>{file.fileName}</p>
                )}
                <p className="text-xs text-gray-500">{file.fileSize} - Caricato: {new Date(file.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                    <MoreVertical className="w-5 h-5"/>
                </button>

                {/* --- MENU A TENDINA --- */}
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-2xl border z-10">
                        <ul>
                            <li>
                                <button onClick={handleRenameClick}
                                        className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-gray-700">
                                    <Pencil className="w-4 h-4"/> Rinomina
                                </button>
                            </li>
                            <li>
                                <button onClick={() => onDownload(file.id)}
                                        className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-gray-700">
                                    <Download className="w-4 h-4"/> Scarica
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setConfirmPopup(true)}
                                        className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-red-600">
                                    <Trash2 className="w-4 h-4"/> Elimina
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
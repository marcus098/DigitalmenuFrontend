import React, { useState, useRef, useEffect } from 'react';
import { FolderIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { FolderDto } from "../../types";

interface FolderCardProps {
    folder: FolderDto;
    onOpen: (folderId: number) => void;
    onRename: (folderId: number, newName: string) => void;
    onDelete: (folderId: number) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder, onOpen, onRename, onDelete }) => {
    // 2. Stato per la visibilità del menu dropdown
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // 3. Stato per attivare la modalità di rinomina
    const [isRenaming, setIsRenaming] = useState(false);
    // 4. Stato per gestire il nuovo nome nel campo di input
    const [newName, setNewName] = useState(folder.name);

    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Effetto per chiudere il menu se si clicca fuori
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Effetto per mettere a fuoco l'input quando si entra in modalità rinomina
    useEffect(() => {
        if (isRenaming) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isRenaming]);


    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(prev => !prev);
    };

    const handleRenameClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        setIsRenaming(true);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Sei sicuro di voler eliminare la cartella "${folder.name}"?`)) {
            onDelete(folder.id);
        }
        setIsMenuOpen(false);
    };

    const handleRenameSubmit = () => {
        if (newName.trim() && newName.trim() !== folder.name) {
            onRename(folder.id, newName.trim());
        }
        setIsRenaming(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleRenameSubmit();
        } else if (e.key === 'Escape') {
            setIsRenaming(false);
            setNewName(folder.name);
        }
    };


    return (
        <div onClick={() => !isRenaming && onOpen(folder.id)} className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 flex items-center gap-4 transition-all hover:shadow-xl hover:border-primary cursor-pointer relative">
            <div className="flex-shrink-0">
                <FolderIcon className="w-10 h-10 text-yellow-500" />
            </div>

            <div className="flex-grow overflow-hidden">
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        onClick={e => e.stopPropagation()}
                        className="font-semibold text-gray-800 bg-gray-100 border border-primary rounded-md p-1 w-full"
                    />
                ) : (
                    <p className="font-semibold text-gray-800 truncate">{folder.name}</p>
                )}
                <p className="text-xs text-gray-500">Cartella</p>
            </div>

            {/* Contenitore per il pulsante del menu e il menu stesso */}
            <div ref={menuRef} className="relative">
                <button onClick={handleMenuToggle} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                </button>

                {/* Menu a tendina */}
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <ul className="py-1">
                            <li>
                                <button onClick={handleRenameClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <PencilIcon className="w-4 h-4"/>
                                    Rinomina
                                </button>
                            </li>
                            <li>
                                <button onClick={handleDeleteClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <TrashIcon className="w-4 h-4"/>
                                    Elimina
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
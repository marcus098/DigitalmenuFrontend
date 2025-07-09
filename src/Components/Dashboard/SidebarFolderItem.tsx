// src/Components/Dashboard/SidebarFolderItem.tsx

import React, { useState, useRef, useEffect } from 'react';
import { FolderIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { FolderDto } from "../../types"; // Assicurati che il percorso a types sia corretto

interface SidebarFolderItemProps {
    folder: FolderDto;
    isActive: boolean;
    onSelect: (folderId: number) => void;
    onRename: (folderId: number, newName: string) => void;
    onDelete: (folderId: number) => void;
}

export const SidebarFolderItem: React.FC<SidebarFolderItemProps> = ({ folder, isActive, onSelect, onRename, onDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
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

    const handleItemClick = () => {
        if (!isRenaming) {
            onSelect(folder.id);
        }
    }

    return (
        <div
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer group ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={handleItemClick}
        >
            {/* Area cliccabile per la selezione */}
            <div className="flex items-center gap-3 flex-grow overflow-hidden">
                <FolderIcon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-yellow-500'}`} />
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        onClick={e => e.stopPropagation()}
                        className="font-semibold bg-white border border-primary rounded p-0.5 w-full"
                    />
                ) : (
                    <span className="font-semibold truncate">{folder.name}</span>
                )}
            </div>

            {/* Pulsante per il menu, appare su hover (o sempre se il menu è aperto) */}
            <div ref={menuRef} className="relative flex-shrink-0">
                <button
                    onClick={handleMenuToggle}
                    className={`p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700 ${!isMenuOpen && 'opacity-0 group-hover:opacity-100'}`}
                >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                </button>

                {/* Menu a tendina */}
                {isMenuOpen && (
                    <div className="absolute left-full -top-2 ml-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
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
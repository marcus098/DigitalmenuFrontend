import React, {useEffect, useRef, useState} from 'react';
import { FolderPlusIcon, DocumentPlusIcon, FolderIcon } from '@heroicons/react/24/outline';
import {FolderCard} from "../../Components/Dashboard/FolderCard";
import {FileCard} from "../../Components/Dashboard/FileCard";
import {NewFolderModal} from "../../Components/Dashboard/NewFolderModal";
import {ChevronDownIcon} from "@heroicons/react/24/solid";
import CustomLoading from "../../Components/CustomLoading";
import {
    addFileApi, addFolderApi, deleteFileApi, deleteFolderApi, downloadFileApi,
    forceDeleteFolderApi,
    getFilesApi,
    getFoldersApi,
    renameFileApi,
    renameFolderApi
} from "../../Utilities/api";
import {useNotification} from "../../Context/NotificationContext";
import {FileDto, FolderDto} from "../../types";
import {SidebarFolderItem} from "../../Components/Dashboard/SidebarFolderItem";

export interface DocFile {
    id: string;
    name: string;
    size: string;
    type: 'pdf' | 'doc' | 'image' | 'generic';
    folderId: string | null; // null per la root
    lastModified: string;
}

export interface DocFolder {
    id: string;
    name: string;
}


const DocumentsPage: React.FC = () => {
    // La logica di stato principale rimane invariata
    const [folders, setFolders] = useState<FolderDto[]>([]);
    const [files, setFiles] = useState<FileDto[]>([]);
    const [fileToLoad, setFileToLoad] = useState<File | null>(null)
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState<boolean>(true)

    // --- NUOVO STATO PER IL DROPDOWN MOBILE ---
    const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { addNotification } = useNotification()

    const currentFolderName = currentFolderId ? folders.find(f => f.id === currentFolderId)?.name : 'Tutti i Documenti';

    const itemsInCurrentFolder = {
        folders: [], // Sottocartelle non ancora implementate
        files: files.filter(file => file.parentFolder === currentFolderId),
    };

    // --- NUOVO EFFETTO PER CHIUDERE IL DROPDOWN QUANDO SI CLICCA FUORI ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsFolderDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    const handleFileUpload = async (uploadedFiles: FileList) => {
        if(!currentFolderId) return
        if(uploadedFiles.length > 0){
            setFileToLoad(uploadedFiles[0])
            const formData: FormData = new FormData()
            formData.append("parentFolder", currentFolderId.toString())
            formData.append("file", uploadedFiles[0])
            addFile(formData)
        }
    };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => { /* ... */ };
    const handleSelectFolder = (folderId: number | null) => {
        setCurrentFolderId(folderId);
        if(folderId)
            loadFiles(folderId)
        setIsFolderDropdownOpen(false); // Chiudi il dropdown dopo la selezione
    };

    useEffect(() => {
        initialLoading()
    }, []);

    const initialLoading = async() => {
        const foldersTmp = await loadFolders()
        setFolders([...foldersTmp])
        if(foldersTmp.length > 0){
            const value = window.location.hash
            if(value && value.replace("#", "")){
                // cerco quella folderid
                try {
                    for (const fold of foldersTmp) {
                        if (fold.id === Number(value.replace("#", ""))){
                            setCurrentFolderId(fold.id)
                            loadFiles(fold.id)
                            break;
                        }
                    }
                }catch (error){
                    setCurrentFolderId(foldersTmp[0].id)
                    loadFiles(foldersTmp[0].id)
                }
            }else{
                // altrimenti prendo la prima folderId trovata
                setCurrentFolderId(foldersTmp[0].id)
                loadFiles(foldersTmp[0].id)
            }
        }else{
            setLoading(false)
        }
    }

    const addFile = async(formData: FormData) => {
        setLoading(true)
        if(!currentFolderId) return
        const response = await addFileApi(formData);
        if(response && response.success && response.data?.data){
            const tmp = [...files]
            tmp.push(response.data.data)
            setFiles([...tmp])
            addNotification({message: "File aggiunto!", type: "success"})
        }else{
            addNotification({message: "Errore", type: "error"})
        }
        setLoading(false)
    }

    const deleteFile = async(id: number) => {
        setLoading(true)

        const response = await deleteFileApi(1);
        if(response && response.success && response.data?.data){
            const newList: FileDto[] = []
            for(const f of files){
                if(f.id !== id)
                    newList.push(f)
            }
            setFiles([...newList])
            addNotification({message: "File eliminato!", type: "success"})
        }else{
            addNotification({message: "Errore", type: "error"})
        }
        setLoading(false)
    }

    const deleteFolder = async(id: number) => {
        setLoading(true)

        const response = await deleteFolderApi(id);
        console.log(response)
        if(response && response.success && response.data?.data){
            const newList: FolderDto[] = []
            for(const f of folders){
                if(f.id !== id){
                    newList.push(f)
                }
            }
            setFolders([...newList])
            addNotification({message: "Cartella eliminata!", type: "success"})
        }else{
            addNotification({message: "Errore", type: "error"})
        }
        setLoading(false)
    }

    const forceDeleteFolder = async(id: number) => {
        setLoading(true)

        const response = await forceDeleteFolderApi(id);
        if(response && response.success && response.data?.data){
            const newList: FolderDto[] = []
            for(const f of folders){
                if(f.id !== id){
                    newList.push(f)
                }
            }
            // todo se sto eliminando la cartella attuale devo visualizzarne un'altra
            addNotification({message: "Cartella eliminata!", type: "success"})
            initialLoading()
        }else{
            addNotification({message: "Errore", type: "error"})
        }
        setLoading(false)
    }

    const loadFolders = async(): Promise<FolderDto[]> => {
        const response = await getFoldersApi();

        if(response && response.success && response.data?.data){
            return response.data.data
        }else{
            return []
            addNotification({message: "Errore", type: "error"})
        }
    }

    const loadFiles = async(folderId: number) => {
        setLoading(true)

        const response = await getFilesApi(folderId);
        if(response && response.success && response.data?.data){
            setFiles([...response.data.data])
        }else{
            addNotification({message: "Errore", type: "error"})
        }
        setLoading(false)
    }

    const renameFolder = async(id: number, name: string) => {
        if(!currentFolderId) return
        setLoading(true)

        const response = await renameFolderApi(currentFolderId, "");
        if(response && response.success && response.data?.data){
            const newList: FolderDto[] = []
            for(const f of folders){
                if(f.id === id){
                    newList.push(response.data.data)
                }else{
                    newList.push(f)
                }
            }
            setFolders([...newList])
            addNotification({message: "Cartella rinominata!", type: "success"})
        }else{
            addNotification({message: "Errore", type: "error"})
        }
        setLoading(false)
    }

    const renameFile = async(id: number, name: string) => {
        setLoading(true)
        const response = await renameFileApi(id, name);
        if(response && response.success && response.data?.data){
            const newList: FileDto[] = []
            for(const f of files){
                if(f.id === id){
                    newList.push(response.data.data)
                }else{
                    newList.push(f)
                }
            }
            setFiles([...newList])
            addNotification({message: "File rinominato!", type: "success"})
        }else{
            addNotification({message: "Errore", type: "error"})
        }
        setLoading(false)
    }

    const downloadFile = async(id: number) => {
        setLoading(true)
        const response = await downloadFileApi(id)
        if(response && response.success && response.data?.data){
            window.open(response.data.data, '_blank', 'noopener,noreferrer');
        }else{
            addNotification({message: "Errore", type: "error"})
        }
        setLoading(false)
    }

    const handleCreateFolder = async(folderName: string) => {
        setLoading(true)
        const response = await addFolderApi(folderName);
        if(response && response.success && response.data?.data){
            const tmp = [...folders]
            tmp.push(response.data.data)
            setFolders([...tmp])
            addNotification({message: "Cartella creata!", type: "success"})
        }else{
            addNotification({message: "Errore", type: "error"})
        }
        setLoading(false)
    }

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            {loading && <CustomLoading isFullPage={true} isTransparent={true} />}
            {isNewFolderModalOpen && <NewFolderModal onClose={() => setIsNewFolderModalOpen(false)} onCreate={handleCreateFolder} />}

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestione Documenti</h1>
                <p className="text-gray-500 mt-1">Archivia e organizza i file importanti della tua attività.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* --- Sidebar Cartelle (Visibile solo su Desktop) --- */}
                <aside className="w-64 hidden lg:block">
                    <div className="bg-white p-4 rounded-xl shadow-lg h-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Cartelle</h3>
                        <nav className="space-y-1">
                            {folders.map(folder => (
                                <SidebarFolderItem
                                    key={folder.id}
                                    folder={folder}
                                    isActive={currentFolderId === folder.id}
                                    onSelect={handleSelectFolder}
                                    onRename={renameFolder}
                                    onDelete={deleteFolder}
                                />
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* --- Area Principale --- */}
                <main className="flex-1">
                    {/* Action Bar e Breadcrumbs */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">

                        {/* --- NUOVO: DROPDOWN PER MOBILE --- */}
                        <div ref={dropdownRef} className="relative w-full lg:hidden">
                            <button onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                                    className="btn-secondary w-full flex items-center justify-between">
                            <span className="font-semibold">{currentFolderName}</span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isFolderDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isFolderDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border z-20">
                                    <nav className="p-2 space-y-1 max-h-60 overflow-y-auto">
                                        {folders.map(folder => (
                                            <SidebarFolderItem
                                                key={folder.id}
                                                folder={folder}
                                                isActive={currentFolderId === folder.id}
                                                // handleSelectFolder chiude già il dropdown, quindi è perfetto
                                                onSelect={handleSelectFolder}
                                                onRename={renameFolder}
                                                onDelete={deleteFolder}
                                            />
                                        ))}
                                    </nav>
                                </div>
                            )}
                        </div>

                        {/* Testo per Desktop */}
                        <p className="text-sm font-semibold text-gray-500 hidden lg:block">Stai visualizzando: <span className="text-primary">{currentFolderName}</span></p>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button onClick={() => setIsNewFolderModalOpen(true)} className="btn-secondary w-full md:w-auto flex items-center justify-center"><FolderPlusIcon className="w-5 h-5 mr-2"/>Nuova Cartella</button>
                            <input type="file" id="file-upload" className="hidden" multiple onChange={e => handleFileUpload(e.target.files!)} />
                            <button onClick={() => document.getElementById('file-upload')?.click()} className="btn-primary w-full md:w-auto flex items-center justify-center"><DocumentPlusIcon className="w-5 h-5 mr-2"/>Carica File</button>
                        </div>
                    </div>

                    {/* Griglia File e Zona Drag&Drop */}
                    <div
                        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        className={`bg-white p-4 rounded-xl shadow-lg min-h-[60vh] transition-all duration-300 ${isDragging ? 'border-4 border-dashed border-primary bg-primary/10' : 'border-4 border-transparent'}`}
                    >
                        {isDragging ? (
                            <div className="flex items-center justify-center h-full w-full pointer-events-none"><p className="text-xl font-semibold text-primary">Rilascia i file per caricarli</p></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {itemsInCurrentFolder.folders.map(folder => <FolderCard onRename={renameFolder} onDelete={deleteFolder} key={folder} folder={folder} onOpen={handleSelectFolder}/>)}
                                {itemsInCurrentFolder.files.map(file => <FileCard onDelete={deleteFile} onRename={renameFile} onDownload={downloadFile} key={file.id} file={file} />)}
                                {itemsInCurrentFolder.files.length === 0 && itemsInCurrentFolder.folders.length === 0 && (
                                    <div className="col-span-full text-center py-16 text-gray-500"><p className="font-semibold">Questa cartella è vuota.</p><p className="text-sm mt-1">Trascina qui i file o usa i pulsanti in alto per iniziare.</p></div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DocumentsPage;
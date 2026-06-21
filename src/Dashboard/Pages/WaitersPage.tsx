// src/pages/WaitersPage.tsx
import React, {useState, useMemo, useEffect} from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/solid';
import WaiterCard, {Waiter} from "../../Components/Dashboard/WaiterCard";
import {useData} from "../../Context/DataContext";
import CustomLoading from "../../Components/CustomLoading";
import AddWaiterModal from "../../Components/Dashboard/AddWaiterModal";
import EditWaiterModal from "../../Components/Dashboard/EditWaiterModal";
import DeletePopup from "../../Components/DeletePopup";
import {useNotification} from "../../Context/NotificationContext";
import {useLoginContext} from "../../Context/LoginContext";
import {IS_ADMIN} from "../../types";
import {useNavigate, useParams} from "react-router-dom";
const WaitersPage: React.FC = () => {
    const [waiters, setWaiters] = useState<Waiter[]>([]);
    const { loading, getWaiters, getWaiterInvitationUrl, deleteWaiter, confirmWaiter } = useData()
    const { addNotification } = useNotification()
    const { user, checkVariable } = useLoginContext()
    const navigate = useNavigate()
    const {localname} = useParams()

    useEffect(() => {
        loadWaiters()
    }, []);

    useEffect(() => {
        if(user && !checkVariable(IS_ADMIN)){
            navigate("/" + localname + "/Dashboard/Home")
        }
    }, [user]);

    const loadWaiters = async() => {
        const tmp = await getWaiters()
        if(tmp === null)
            addNotification({message: "Errore", type: "error"})
        else
            setWaiters([...tmp])
    }

    const generateWaiterLink = async (): Promise<string> => {
        const tmp = await getWaiterInvitationUrl()
        if(tmp === null)
            addNotification({message: "Errore", type: "error"})
        else
            return 'http://localhost:3000/urlInvite/' + (user?.idAgency || 0) + "/" + tmp
        return ""
    };

    //const updateWaiter = async (id: number, newName: string): Promise<void> => {
    //    await fakeApiCall();
    //    setWaiters(currentWaiters =>
    //        currentWaiters.map(w => (w.id === id ? { ...w, name: newName } : w))
    //    );
    //};

    const deleteWaiterFunc = async (id: number): Promise<void> => {
        const response = await deleteWaiter(id)
        if(response)
            setWaiters(currentWaiters => currentWaiters.filter(w => w.id !== id));
        else
            addNotification({message: "Errore", type: "error"})
    };

    // --- FINE DATI E FUNZIONI FITTIZIE ---


    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
    const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
    const [newWaiterLink, setNewWaiterLink] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredWaiters = useMemo(() => {
        return waiters.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [waiters, searchTerm]);

    const handleAddClick = async () => {
        setIsSubmitting(true);
        const link = await generateWaiterLink();
        if (link) {
            setNewWaiterLink(link);
            setIsAddModalOpen(true);
        }
        setIsSubmitting(false);
    };

    const handleEditClick = (waiter: Waiter) => {
        setSelectedWaiter(waiter);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (id: number, newName: string) => {
        //setIsSubmitting(true);
        //await updateWaiter(id, newName);
        //setIsSubmitting(false);
        //setIsEditModalOpen(false);
        //setSelectedWaiter(null);
    };

    const handleDeleteClick = (waiter: Waiter) => {
        setSelectedWaiter(waiter);
        setIsDeletePopupOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedWaiter) return;
        setIsSubmitting(true);
        await deleteWaiterFunc(selectedWaiter.id);
        setIsSubmitting(false);
        setIsDeletePopupOpen(false);
        setSelectedWaiter(null);
    };

    const confirmWaiterFunc = async(id: number) => {
        const response = await confirmWaiter(id)
        if(response){
            await loadWaiters()
        }else{
            addNotification({message: "Errore", type: "error"})
        }
    }

    if (loading) return <CustomLoading isFullPage={true} isTransparent={true} />;

    return (
        <>
            {/* Sezione Modali */}
            {isSubmitting && <CustomLoading isTransparent={true} />}
            {isAddModalOpen && newWaiterLink && <AddWaiterModal link={newWaiterLink} onClose={() => setIsAddModalOpen(false)} />}
            {isEditModalOpen && selectedWaiter && <EditWaiterModal waiter={selectedWaiter} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveEdit} />}
            {isDeletePopupOpen && selectedWaiter && (
                <DeletePopup
                    itemName={selectedWaiter.name}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setIsDeletePopupOpen(false)}
                />
            )}

            {/* Layout Pagina */}
            <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Gestione Camerieri</h1>
                    <button onClick={handleAddClick} className="bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-primary-dark font-semibold flex items-center justify-center gap-2">
                        <PlusIcon className="w-5 h-5"/>
                        <span>Aggiungi Cameriere</span>
                    </button>
                </div>

                <div className="mb-6">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                        <input type="text" placeholder="Cerca un cameriere..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                               className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                    </div>
                </div>

                {/* Griglia Camerieri */}
                {filteredWaiters.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredWaiters.map((waiter) => (
                            <WaiterCard key={waiter.id} waiter={waiter} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12"><p className="text-gray-500">Nessun cameriere trovato.</p></div>
                )}
            </div>
        </>
    );
};

export default WaitersPage;
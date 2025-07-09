import React, {useEffect, useState} from 'react';
import {useLoginContext} from "../../Context/LoginContext";
import {useNotification} from "../../Context/NotificationContext";
import { UserIcon, KeyIcon, PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface UserProfile {
    name: string;
    email: string;
    phone: string;
    address: string;
}

const ProfilePage: React.FC = () => {
    // La tua logica di stato è corretta e viene mantenuta
    const { user, changePasswordFunc, updateProfileFunc } = useLoginContext();
    const [editing, setEditing] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [newUserDetails, setNewUserDetails] = useState<UserProfile>({ name: '', email: '', address: '', phone: '' });
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const { addNotification } = useNotification();

    useEffect(() => {
        if (user) {
            setNewUserDetails({
                name: user.name || "",
                email: user.email || "",
                address: user.address || "",
                phone: user.phone || ""
            });
        }
    }, [user]);

    // Le tue funzioni gestore rimangono le stesse
    const handleSave = async () => {
        const response = await updateProfileFunc(newUserDetails);
        if (response) {
            addNotification({ message: "Profilo aggiornato con successo!", type: "success" });
            setEditing(false);
        } else {
            addNotification({ message: "Errore durante l'aggiornamento.", type: "error" });
        }
    };

    const handleCancel = () => {
        if (user) setNewUserDetails({ name: user.name || "", email: user.email || "", address: user.address || "", phone: user.phone || "" });
        setEditing(false);
    };

    const handleChange = (field: keyof UserProfile, value: string) => {
        setNewUserDetails({ ...newUserDetails, [field]: value });
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            addNotification({ message: "Le nuove password non coincidono.", type: "warning" });
            return;
        }
        const response = await changePasswordFunc(currentPassword, newPassword);
        if (response) {
            addNotification({ message: "Password modificata con successo!", type: "success" });
            setShowChangePasswordModal(false);
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } else {
            addNotification({ message: "Errore: la password attuale potrebbe non essere corretta.", type: "error" });
        }
    };

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            {/* Header Pagina */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Il Mio Profilo</h1>
                <p className="text-gray-500 mt-1">Gestisci le tue informazioni personali e di sicurezza.</p>
            </div>

            {/* Layout a Griglia */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Colonna Sinistra: Dati Profilo */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Informazioni Personali</h3>
                                <p className="text-sm text-gray-500">Questi dati sono visibili solo a te.</p>
                            </div>
                            {!editing && (
                                <button onClick={() => setEditing(true)} className="btn-secondary flex items-center text-sm">
                                    <PencilSquareIcon className="w-5 h-5 mr-2"/>
                                    Modifica
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="label-style">Nome Completo</label>
                                <input type="text" value={newUserDetails.name} onChange={(e) => handleChange('name', e.target.value)} disabled={!editing} className="input-style disabled:bg-slate-100 disabled:cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="label-style">Email</label>
                                <input type="email" value={newUserDetails.email} onChange={(e) => handleChange('email', e.target.value)} disabled={!editing} className="input-style disabled:bg-slate-100 disabled:cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="label-style">Numero di Telefono</label>
                                <input type="tel" value={newUserDetails.phone} onChange={(e) => handleChange('phone', e.target.value)} disabled={!editing} className="input-style disabled:bg-slate-100 disabled:cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="label-style">Indirizzo</label>
                                <input type="text" value={newUserDetails.address} onChange={(e) => handleChange('address', e.target.value)} disabled={!editing} className="input-style disabled:bg-slate-100 disabled:cursor-not-allowed" />
                            </div>
                        </div>

                        {editing && (
                            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end items-center gap-3">
                                <button onClick={handleCancel} className="btn-secondary">Annulla</button>
                                <button onClick={handleSave} className="btn-primary flex items-center"><CheckIcon className="w-5 h-5 mr-2"/>Salva Modifiche</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Colonna Destra: Sicurezza */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Sicurezza</h3>
                        <p className="text-sm text-gray-500 mb-4">Mantieni il tuo account al sicuro.</p>
                        <button onClick={() => setShowChangePasswordModal(true)} className="btn-secondary w-full flex items-center justify-center">
                            <KeyIcon className="w-5 h-5 mr-2" />
                            Cambia Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Modale Cambia Password */}
            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Cambia la tua Password</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label-style">Password Attuale</label>
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-style" />
                            </div>
                            <div>
                                <label className="label-style">Nuova Password</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-style" />
                            </div>
                            <div>
                                <label className="label-style">Conferma Nuova Password</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-style" />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 mt-8">
                            <button onClick={() => setShowChangePasswordModal(false)} className="btn-secondary">Annulla</button>
                            <button onClick={handlePasswordChange} className="btn-primary">Salva Password</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
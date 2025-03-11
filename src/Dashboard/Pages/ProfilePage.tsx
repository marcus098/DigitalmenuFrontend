import React, { useState } from 'react';

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    address: string;
}

const ProfilePage: React.FC = () => {
    const [user, setUser] = useState<UserProfile>({
        name: 'Mario Rossi',
        email: 'mario.rossi@example.com',
        phone: '+39 123 456 789',
        address: 'Via Roma 123, Milano',
    });

    const [editing, setEditing] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [newUserDetails, setNewUserDetails] = useState<UserProfile>(user);
    const [currentPassword, setCurrentPassword] = useState<string>('')
    const [newPassword, setNewPassword] = useState<string>('')
    const [confirmPassword, setConfirmPassword] = useState<string>('')

    const handleEdit = () => {
        setEditing(true);
    };

    const handleSave = () => {
        setUser(newUserDetails);
        setEditing(false);
    };

    const handleCancel = () => {
        setNewUserDetails(user);
        setEditing(false);
    };

    const handleChange = (field: keyof UserProfile, value: string) => {
        setNewUserDetails({ ...newUserDetails, [field]: value });
    };

    const handlePasswordChange = () => {
        // Simula il cambio della password
        alert('Password cambiata con successo!');
        setShowChangePasswordModal(false);
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 text-center">Il Mio Profilo</h1>

            {/* Dati Profilo */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Nome</h2>
                    {editing ? (
                        <input
                            type="text"
                            value={newUserDetails.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    ) : (
                        <p className="text-gray-600">{user.name}</p>
                    )}
                </div>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Email</h2>
                    {editing ? (
                        <input
                            type="email"
                            value={newUserDetails.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    ) : (
                        <p className="text-gray-600">{user.email}</p>
                    )}
                </div>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Numero di Telefono</h2>
                    {editing ? (
                        <input
                            type="tel"
                            value={newUserDetails.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    ) : (
                        <p className="text-gray-600">{user.phone}</p>
                    )}
                </div>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Indirizzo</h2>
                    {editing ? (
                        <input
                            type="text"
                            value={newUserDetails.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    ) : (
                        <p className="text-gray-600">{user.address}</p>
                    )}
                </div>

                {/* Bottoni per editare e salvare */}
                <div className="mt-6 flex space-x-4">
                    {editing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-600 transition"
                            >
                                Salva
                            </button>
                            <button
                                onClick={handleCancel}
                                className="bg-red-500 text-white px-4 py-2 rounded-md shadow hover:bg-red-600 transition"
                            >
                                Annulla
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleEdit}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600 transition"
                        >
                            Modifica Dati
                        </button>
                    )}
                </div>
            </div>

            {/* Cambia Password */}
            <div className="mt-6">
                <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600 transition"
                >
                    Cambia Password
                </button>
            </div>

            {/* Modal Cambia Password */}
            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-xl font-semibold mb-4">Cambia Password</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Password Attuale</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Nuova Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Conferma Nuova Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowChangePasswordModal(false)}
                                className="bg-red-500 text-white px-4 py-2 rounded-md"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handlePasswordChange}
                                className="bg-green-500 text-white px-4 py-2 rounded-md"
                            >
                                Salva
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;

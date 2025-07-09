import React, {useEffect, useState} from 'react';
import {getAgencyByIdApi, registerWaiterApi} from "../../Utilities/api";
import {SignupWaiter} from "../../types";
import {useParams} from "react-router-dom";
import {useNotification} from "../../Context/NotificationContext";

const WaiterSignupPage: React.FC = () => {
    const [formData, setFormData] = useState({
        image: '',
        firstName: '',
        lastName: '',
        email: '',
        restaurantName: '',
        phone: '',
        password: '',
        privacyAccepted: false,
    });
    const [isShowSuccess, setIsShowSuccess] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [localname, setLocalname] = useState<string>("")
    const {id, code} = useParams()
    const { addNotification } = useNotification()

    useEffect(() => {
        loadAgency()
    }, []);

    const loadAgency = async () => {
        if(!id) window.location.href = process.env.REACT_APP_URL + "/login";
        const response = await getAgencyByIdApi(Number(id));
        if(response.status === 200 && response.data?.data){
            setLocalname(response.data.data)
            setLoading(false)
        }else{
            window.location.href = process.env.REACT_APP_URL + "/login"
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, type, checked, files} = e.target;
        if (name === 'image' && files && files[0]) {
            const reader = new FileReader();
            reader.onload = () => {
                setFormData({
                    ...formData,
                    image: reader.result as string,
                });
            };
            reader.readAsDataURL(files[0]);
        } else {
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? checked : value,
            });
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.privacyAccepted) {
            alert('Please accept the privacy policy to proceed.');
            return;
        }

        if(!id || !code)
            return;

        const registerWaiter: SignupWaiter = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone || "",
            password: formData.password,
            idAgency: Number(id),
            code: code
        }
        const response = await registerWaiterApi(registerWaiter);
        if(response.success){
            setIsShowSuccess(true)
        }else{
            addNotification({message: "Errore", type: "error"})
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-yellow-400">
            {isShowSuccess ?
                <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-2xl text-center">
                    <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-800">Registrazione
                        Effettuata!</h2>
                    <p className="text-gray-700 text-lg mb-4">
                        Un link di conferma è stato inviato alla tua email.
                    </p>
                    <p className="text-gray-700 text-lg">
                        Controlla anche la cartella **spam** o **posta indesiderata**
                    </p>
                </div>
                :
                <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-2xl">
                    <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-800">Inserisci i tuoi dati</h2>
                    <form onSubmit={handleFormSubmit}>
                        <div className="mb-4">
                            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-600">
                                Nome*
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm focus:outline-none focus:ring-2"
                                placeholder="Inserisci il tuo nome"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-600">
                                Cognome*
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm focus:outline-none focus:ring-2"
                                placeholder="Inserisci il tuo cognome"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-600">
                                Indirizzo email*
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm focus:outline-none focus:ring-2"
                                placeholder="Inserisci la tua email"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-600">
                                Password*
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm focus:outline-none focus:ring-2"
                                placeholder="Inserisci la tua password"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="restaurantName" className="block text-sm font-semibold text-gray-600">
                                Nome locale
                            </label>
                            <input
                                type="text"
                                id="restaurantName"
                                name="restaurantName"
                                value={localname}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm focus:outline-none focus:ring-2"
                                placeholder=""
                                disabled
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-600">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm focus:outline-none focus:ring-2"
                                placeholder="Inserisci il tuo numero di telefono"
                            />
                        </div>
                        <div className="mb-6 flex items-center">
                            <input
                                type="checkbox"
                                id="privacyAccepted"
                                name="privacyAccepted"
                                checked={formData.privacyAccepted}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-orange-500 focus:ring-orange-400 border-orange-500 rounded"
                            />
                            <label htmlFor="privacyAccepted" className="ml-2 block text-sm text-gray-600">
                                Accetto la <a href="#" className="text-orange-500 hover:underline">privacy policy</a> *
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-400 focus:ring-offset-2 transition-transform transform hover:scale-105 duration-300"
                        >
                            Registrati
                        </button>
                        <p className="mt-4 text-sm text-center text-gray-600">
                            Hai già un account?{' '}
                            <a href="/login" className="text-orange-500 font-semibold hover:underline">
                                Login
                            </a>
                        </p>
                    </form>
                </div>}
        </div>
    );
};

export default WaiterSignupPage;

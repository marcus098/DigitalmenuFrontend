import React, { useState } from 'react';
import {useLoginContext} from "../Context/LoginContext";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { _login } = useLoginContext()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        _login(email, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-yellow-400">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl relative animate-fade-in">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-orange-500 to-red-600 p-5 rounded-full shadow-lg animate-pulse">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="white"
                        className="w-12 h-12"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 11c0-2.485-1.79-4-4-4S4 8.515 4 11c0 1.5.81 2.838 2.033 3.417a2 2 0 01-.533 3.017M20 11c0-2.485-1.79-4-4-4s-4 1.515-4 4c0 1.5.81 2.838 2.033 3.417a2 2 0 00-.533 3.017"
                        />
                    </svg>
                </div>
                <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-800">Welcome Back!</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-6">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-600">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-600">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-400 focus:ring-offset-2 transition-transform transform hover:scale-105 duration-300"
                    >
                        Sign In
                    </button>
                </form>
                <p className="text-sm text-center text-gray-600 mt-6">
                    New here? <a href="/signup" className="text-orange-500 font-medium hover:underline">Create an account</a>
                </p>
            </div>
        </div>
    );
};


export default LoginPage;

import React, { useState } from 'react';

const SignupPage: React.FC = () => {
    const [formData, setFormData] = useState({
        image: '',
        firstName: '',
        lastName: '',
        email: '',
        restaurantName: '',
        phone: '',
        privacyAccepted: false,
    });

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

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.privacyAccepted) {
            alert('Please accept the privacy policy to proceed.');
            return;
        }
        console.log('Form Data Submitted:', formData);
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-yellow-400">
            <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-2xl">
                <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-800">Register Your Restaurant</h2>
                <form onSubmit={handleFormSubmit}>
                    <div className="mb-4 text-center">
                        {formData.image ? (
                            <img
                                src={formData.image}
                                alt="Restaurant Preview"
                                className="w-24 h-24 mx-auto rounded-full border-2 border-orange-500"
                            />
                        ) : (
                            <div
                                className="w-24 h-24 mx-auto rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400">
                                No Image
                            </div>
                        )}
                        <label htmlFor="image"
                               className="block mt-2 text-sm font-semibold text-orange-500 cursor-pointer hover:underline">
                            Upload Image
                        </label>
                        <input
                            type="file"
                            id="image"
                            name="image"
                            onChange={handleInputChange}
                            className="hidden"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="firstName" className="block text-sm font-semibold text-gray-600">
                            First Name
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm focus:outline-none focus:ring-2"
                            placeholder="Enter your first name"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="lastName" className="block text-sm font-semibold text-gray-600">
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm focus:outline-none focus:ring-2"
                            placeholder="Enter your last name"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-600">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm focus:outline-none focus:ring-2"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="restaurantName" className="block text-sm font-semibold text-gray-600">
                            Restaurant Name
                        </label>
                        <input
                            type="text"
                            id="restaurantName"
                            name="restaurantName"
                            value={formData.restaurantName}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm focus:outline-none focus:ring-2"
                            placeholder="Enter your restaurant name"
                            required
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
                            placeholder="Enter your phone number"
                            required
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
                            I accept the <a href="#" className="text-orange-500 hover:underline">privacy policy</a>
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-400 focus:ring-offset-2 transition-transform transform hover:scale-105 duration-300"
                    >
                        Register
                    </button>
                    <p className="mt-4 text-sm text-center text-gray-600">
                        Already have an account?{' '}
                        <a href="/login" className="text-orange-500 font-semibold hover:underline">
                            Login here
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;

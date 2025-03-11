import React from 'react';

const Sidebar = () => {
    return (
        <div className="w-64 bg-gray-800 text-white h-full p-4">
            <div className="text-xl font-semibold mb-6">Logo</div>
            <ul>
                <li className="mb-4">
                    <a href="#" className="flex items-center space-x-2 hover:bg-gray-700 p-2 rounded">
                        <span>🏠</span>
                        <span>Home</span>
                    </a>
                </li>
                <li className="mb-4">
                    <a href="#" className="flex items-center space-x-2 hover:bg-gray-700 p-2 rounded">
                        <span>🍽️</span>
                        <span>Menu</span>
                    </a>
                </li>
                <li className="mb-4">
                    <a href="#" className="flex items-center space-x-2 hover:bg-gray-700 p-2 rounded">
                        <span>🪑</span>
                        <span>Tavoli</span>
                    </a>
                </li>
                <li className="mb-4">
                    <a href="#" className="flex items-center space-x-2 hover:bg-gray-700 p-2 rounded">
                        <span>📊</span>
                        <span>Statistiche</span>
                    </a>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;

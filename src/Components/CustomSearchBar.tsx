import React, { useState } from 'react';

interface CustomSearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    searchButton?: boolean
}

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({ placeholder = 'Search...', onSearch, searchButton }) => {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        onSearch(query); // Chiamata alla funzione di ricerca con la query
    };

    const change = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value)
        if(!searchButton)
            onSearch(e.target.value)
    }

    return (
        <div className="flex items-center space-x-2">
            <input
                type="text"
                value={query}
                onChange={change}
                placeholder={placeholder}
                className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            {searchButton && <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
                Search
            </button>}
        </div>
    );
};

export default CustomSearchBar;

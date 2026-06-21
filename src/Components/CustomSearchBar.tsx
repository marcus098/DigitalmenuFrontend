import React, { useState } from 'react';
import clsx from 'clsx';

interface CustomSearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    searchButton?: boolean;
}

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({ placeholder = 'Search...', onSearch, searchButton }) => {
    const [query, setQuery] = useState('');

    const change = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        if (!searchButton) {
            onSearch(e.target.value);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <input
                type="text"
                value={query}
                onChange={change}
                placeholder={placeholder}
                className={clsx(
                    "px-4 py-2 w-full border border-neutral-300 rounded-lg",
                    "focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
                )}
            />
            {searchButton && (
                <button
                    onClick={() => onSearch(query)}
                    className="px-4 py-2 rounded-lg bg-primary-400 hover:bg-primary-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
                >
                    Search
                </button>
            )}
        </div>
    );
};

export default CustomSearchBar;

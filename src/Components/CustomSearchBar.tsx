import React, { useContext, useState } from 'react';
import { ThemeContext } from "../Context/ThemeContext";
import clsx from 'clsx';

interface CustomSearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    searchButton?: boolean;
}

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({ placeholder = 'Search...', onSearch, searchButton }) => {
    const [query, setQuery] = useState('');
    const theme = useContext(ThemeContext); // Accedi al contesto del tema

    const handleSearch = () => {
        onSearch(query); // Chiamata alla funzione di ricerca con la query
    };

    const change = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        if (!searchButton) {
            onSearch(e.target.value); // Esegui la ricerca automaticamente se il bottone non è presente
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
                    "px-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-1",
                    theme && theme.theme.colors.inputBorder ? `border-[${theme.theme.colors.inputBorder}]` : "border-gray-300",
                    theme && theme.theme.colors.inputFocus ? `focus:ring-[${theme.theme.colors.inputFocus}]` : "focus:ring-blue-400"
                )}
            />
            {searchButton && (
                <button
                    onClick={handleSearch}
                    className={clsx(
                        "px-4 py-2 rounded-lg focus:outline-none focus:ring-2",
                        theme && theme.theme.colors.buttonBg ? `bg-[${theme.theme.colors.buttonBg}]` : "bg-blue-500",
                        theme && theme.theme.colors.buttonHover ? `hover:bg-[${theme.theme.colors.buttonHover}]` : "hover:bg-blue-700",
                        theme && theme.theme.colors.buttonText ? `text-[${theme.theme.colors.buttonText}]` : "text-white"
                    )}
                >
                    Search
                </button>
            )}
        </div>
    );
};

export default CustomSearchBar;

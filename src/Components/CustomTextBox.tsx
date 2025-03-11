import React, { useState } from 'react';
import {CustomTextBoxProps} from "../types";

const CustomTextBox: React.FC<CustomTextBoxProps> = ({value, onChange, extraCss = ''}) => {
    const [focused, setFocused] = useState(false);

    const handleFocus = () => setFocused(true);
    const handleBlur = () => setFocused(value !== '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className={`relative ${extraCss}`}>
            <input
                type="text"
                id="floating-input"
                className={`peer block w-full px-3 py-2 mt-4 text-gray-900 bg-transparent border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent ${extraCss}`}
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder=" " // Per nascondere il placeholder quando l'etichetta galleggia
            />
            <label
                htmlFor="floating-input"
                className={`absolute left-3 top-2 text-gray-500 transition-all duration-200 transform ${
                    focused || value ? '-translate-y-6 text-blue-500 text-sm' : 'text-base'
                }`}
            >
                Nome
            </label>
        </div>
    );
};

export default CustomTextBox;

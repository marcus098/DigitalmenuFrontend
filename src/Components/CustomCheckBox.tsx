import React from 'react';

interface CustomCheckBoxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}

const CustomCheckBox: React.FC<CustomCheckBoxProps> = ({ checked, onChange, label }) => {
    return (
        <label className="flex items-center space-x-2 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-5 w-5 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-gray-700">{label}</span>
        </label>
    );
};

export default CustomCheckBox;

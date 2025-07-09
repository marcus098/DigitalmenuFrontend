// src/Components/ToggleSwitch.tsx
import React from 'react';

interface ToggleSwitchProps {
    label: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onChange }) => {
    const switchBgColor = enabled ? 'bg-primary' : 'bg-gray-200';
    const switchPosition = enabled ? 'translate-x-5' : 'translate-x-0';

    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <button
                type="button"
                className={`${switchBgColor} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                onClick={() => onChange(!enabled)}
            >
                <span
                    aria-hidden="true"
                    className={`${switchPosition} inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </button>
        </div>
    );
};

export default ToggleSwitch;
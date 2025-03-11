import * as React from "react";

interface ToggleSwitchProps {
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, value, onToggle }) => {
    return (
        <div className="flex items-center">
            <span className="mr-4">{label}</span>
            <div
                className={`relative w-12 h-6 bg-gray-300 rounded-full cursor-pointer transition-all ${value ? "bg-green-500" : "bg-gray-300"}`}
                onClick={() => onToggle(!value)}
            >
                <div
                    className={`absolute w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                        value ? "translate-x-6" : "translate-x-0"
                    }`}
                ></div>
            </div>
        </div>
    );
}

export default ToggleSwitch
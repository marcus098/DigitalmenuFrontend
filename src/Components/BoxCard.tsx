import React from "react";

interface BoxCardProps {
    title: string;
    value: string;
    icon: string;
    onClick: () => void
}

const BoxCard: React.FC<BoxCardProps> = ({ title, value, icon, onClick }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg w-64" style={{cursor: "pointer"}} onClick={onClick}>
            <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">{icon}</span>
                <h3 className="text-xl font-semibold">{title}</h3>
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
};

export default BoxCard;

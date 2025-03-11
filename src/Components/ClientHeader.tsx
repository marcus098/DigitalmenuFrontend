import React from 'react';

interface HeaderProps {
    localname: string;
    logo: string;
}

const ClientHeader: React.FC<HeaderProps> = ({ localname, logo }) => {
    return (
        <header className="bg-blue-50 py-8 shadow-md text-center">
            <h1 className="text-3xl font-bold text-blue-700">{localname}</h1>
            <img
                src={"/tmp/strafameLogo.png"}
                alt="Restaurant Logo"
                className="mx-auto mt-2 w-40 h-40 rounded-full object-cover"
            />
        </header>
    );
};

export default ClientHeader;

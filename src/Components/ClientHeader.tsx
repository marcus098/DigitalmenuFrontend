import React, { useContext } from 'react';
import { ThemeContext } from "../Context/ThemeContext";

interface HeaderProps {
    localname: string;
    logo?: string;
    backgroundImage?: string;
}

const ClientHeader: React.FC<HeaderProps> = ({ localname, logo, backgroundImage }) => {
    const theme = useContext(ThemeContext);
    const headerStyle = {
        backgroundColor: theme?.theme.colors.color1 || '#333',
        // Se c'è un'immagine di sfondo, la usiamo
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    return (
        // Aumentiamo l'altezza e il padding per un look più importante
        <header className="py-12 shadow-xl text-center" style={headerStyle}>
            {logo && (
                <img
                    src={logo}
                    alt="Restaurant Logo"
                    className="mx-auto mb-4 w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
            )}
            <h1 className="text-4xl md:text-5xl font-extrabold" style={{ color: theme?.theme.colors.text1 || '#FFF' }}>
                {localname}
            </h1>
            <p className="text-lg mt-2 opacity-90" style={{color: theme?.theme.colors.text1 || '#FFF'}}>
                Scegli una categoria per iniziare
            </p>
        </header>
    );
};

export default ClientHeader;
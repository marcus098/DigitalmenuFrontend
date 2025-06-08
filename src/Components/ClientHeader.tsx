import React, {useContext} from 'react';
import {ThemeContext} from "../Context/ThemeContext";

interface HeaderProps {
    localname: string;
    logo: string;
}

const ClientHeader: React.FC<HeaderProps> = ({ localname, logo }) => {
    const theme = useContext(ThemeContext)

    return (
        <header className="py-8 shadow-md text-center" style={{backgroundColor: theme?.theme.colors.color1 + ""}}>
            <h1 className="text-3xl font-bold" style={{color: theme?.theme.colors.text1 + ""}}>{localname}</h1>
            <img
                src={"/tmp/strafameLogo.png"}
                alt="Restaurant Logo"
                className="mx-auto mt-2 w-40 h-40 rounded-full object-cover"
            />
        </header>
    );
};

export default ClientHeader;

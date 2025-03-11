import React, {createContext, useState, ReactNode, useContext, useEffect, useMemo} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import {ScreenType, UtilitiesContextType} from "../types";

const UtilitiesContext = createContext<UtilitiesContextType | undefined>(undefined);

export const useUtilitiesContext = () => {
    const context = useContext(UtilitiesContext);
    if (!context) {
        throw new Error('useUtilitiesContext must be used within a UtilitiesProvider');
    }
    return context;
};

export const UtilitiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { localname,  } = useParams();

    const checkScreen = (value: number): ScreenType => {
        if(value < 576)
            return {screen: "MOBILE"}
        else if (value < 1024)
            return {screen: "TABLET"}
        else
            return {screen: "DESKTOP"}
    }

    const [loading, setLoading] = useState<boolean>(false)
    const [transparentLoading, setTransparentLoading] = useState<boolean>(false)
    const [search, setSearch] = useState("")
    //const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [screen, setScreen] = useState<ScreenType>(checkScreen(window.innerWidth))

    //state che mi permette di riavviare la pagina dopo 1000 secondi se appesantita
    //const [countPage, setCountPage] = useState(1000);

    const navigate = useNavigate()

    useEffect(() => {

        //if (!getSessionId() || getSessionId() === "0000") {
        //    generateSessionId();
        //}

        // Countdown interval
        //const countdownInterval = setInterval(() => {
      //      setCountPage(prevCount => prevCount - 1);
        //}, 1000);


        const handleResize = () => {
            //setWindowWidth(window.innerWidth);
            setScreen(checkScreen(window.innerWidth))
        };

        window.addEventListener('resize', handleResize);

        return () => {
            //clearInterval(countdownInterval);
            window.removeEventListener('resize', handleResize);
        };

    }, []);

    /*useEffect(() => {
        if (countPage === 0) {
            window.location.reload(); // Ricarica la pagina
        }
    }, [countPage]);*/

    const goBack = () => {
        navigate(-1)
    }


    const dashboardMeno = useMemo<UtilitiesContextType>(() => ({
        setLoading,
        goBack,
        setSearch,
        setTransparentLoading,
        localname,
        loading,
        transparentLoading,
        search,
        screen,
    }), [screen, search, transparentLoading, loading, localname])

    return (
        <UtilitiesContext.Provider value={dashboardMeno}>
            {children}
        </UtilitiesContext.Provider>
    );
};
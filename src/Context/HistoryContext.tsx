import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

interface HistoryContextProps {
    previousPath: string | null;
    currentPath: string;
    navigateWithHistory: (path: string) => void;
}

const HistoryContext = createContext<HistoryContextProps | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [previousPath, setPreviousPath] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

    const navigate = useNavigate();

    const navigateWithHistory = (path: string) => {
        setPreviousPath(currentPath);
        setCurrentPath(path);
        navigate(path);
    };

    return (
        <HistoryContext.Provider value={{ previousPath, currentPath, navigateWithHistory }}>
            {children}
        </HistoryContext.Provider>
    );
};

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error("useHistory must be used within a HistoryProvider");
    }
    return context;
};

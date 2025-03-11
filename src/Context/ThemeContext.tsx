import React, { createContext, useState, useEffect, ReactNode } from 'react';
//import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, Theme } from '../Theme/theme';
//import {createMuiTheme} from '../theme/MuiTheme'
//import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(lightTheme);

    const toggleTheme = () => {
        setTheme(theme === lightTheme ? lightTheme : lightTheme);
    };

    useEffect(() => {
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? lightTheme : lightTheme;
        setTheme(systemPreference);

        const handleChange = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? lightTheme : lightTheme);
        };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    //const muiTheme = createMuiTheme(theme);


    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {/*<MuiThemeProvider theme={muiTheme}>*/}
            {/* <StyledThemeProvider theme={theme}>*/}
                    {children}
                {/* </StyledThemeProvider>*/}
            {/*</MuiThemeProvider>*/}
        </ThemeContext.Provider>
    );
};

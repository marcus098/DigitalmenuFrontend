import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import {deleteCookie, setCookie} from "../Utilities/Utilities";
import {changePassword, check, getToken, login} from "../Utilities/api";
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";
import {User, LoginResponse, LoginContextType} from "../types";

const LoginContext = createContext<LoginContextType | undefined>(undefined);

export const useLoginContext = () => {
    const context = useContext(LoginContext);
    if (!context) {
        throw new Error('useLoginContext must be used within a LoginProvider');
    }
    return context;
};

export const LoginProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [transparentLoading, setTransparentLoading] = useState<boolean>(false)
    const [authorized, setAuthorized] = useState<boolean>(false)
    const [user, setUser] = useState<User | null>(null);
    const { localname } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        _check()
    }, [])

    const _check = async() => {
        try{
            const response = await check();

            if(response){
                if(response.status === 200 && response.data.status === 200) {
                    const userTmp: User = {
                        name: response.data.name,
                        idAgency: response.data.idAgency,
                        email: response.data.email || "",
                        localname: response.data.localname
                    }
                    setUser(userTmp)
                    setAuthorized(true)
                    if (response.data.isNew) {
                        setCookie('token', response.data.accessToken, response.data.time || 0)
                    }
                    if(response.data.localname !== localname){
                        navigate("/" + response.data.localname + "/Dashboard")
                    }
                }
                if(response.status === 402){
                    return _deleteAuthorized("Errore") // todo gestire errori custom
                }
                if(response.status === 401){
                    return _deleteAuthorized("Accesso negato")
                }
                setLoading(false)
                return true;
            }else{
                // TODO gestire i diversi tipi di accessi
                setAuthorized(false)
                setUser(null)
                if(!window.location.href.includes("/register")) {
                    navigate("/login")
                }
                setLoading(false)
            }
        }catch (error){
            console.log(error)
            if(!window.location.href.includes("/register")) {
                navigate("/login")
            }
            setLoading(false)
        }
    }

    const _deleteAuthorized = (message: string) => {
        if(authorized) {
            setAuthorized(false);
            setUser(null);
        }
        deleteCookie("token")
        setTransparentLoading(false)
        return message;
    }

    const _login = async (email: string, password: string) => {
        setTransparentLoading(true)
        try {
            const response = await login(email, password);

            if(response){
                console.log(response)
                if(response.status === 200){

                    if(!authorized)
                        setAuthorized(true);
                    setCookie("token", response.data.accessToken, response.data.time || 1)
                    setUser({name: response.data.name, email: response.data.email || "", localname: response.data.localname, idAgency: response.data.idAgency})
                    setLoading(false)
                    navigate("/" + response.data.localname + "/Dashboard")
                    return null

                }else if(response.status === 401){

                    return deleteCookie("Errore credenziali")

                }else if(response.status === 402){

                    return deleteCookie("Errore credenziali")

                }else{

                    return deleteCookie("Errore credenziali")

                }
            }else{
                return deleteCookie("Errore credenziali")
            }
        } catch (error) {
            console.log(error)
            // TODO: gestione casistiche accesso (account da confermare, abbonamento scaduto)
        }
        setTransparentLoading(false)
        return "Errore";
    }

    const changePasswordFunc = async (oldPassword: string, newPassword: string ) => {
        let msg: string = "ERROR"
        try{
            const tmp: any = await changePassword(oldPassword, newPassword);
            if(tmp){
                msg = "SUCCESS"
            }
        }catch (error){
            console.log(error)
        }
        return msg;
    }

    const logout = () => {
        deleteCookie("token")
        setAuthorized(false)
        setUser(null)
    };

    const register = async (formData: FormData) => {
        const error = "Errore";
        try{
            const tmp = await axios.post(process.env.REACT_APP_API_URL + '/auth/signup', formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            if(tmp){
                return "Success"
            }
        }catch (error){

        }
        return error;
    }

    return (
        <LoginContext.Provider value={{ _login, logout, changePasswordFunc, register, transparentLoading, loading, user }}>
            {children}
        </LoginContext.Provider>
    );
};
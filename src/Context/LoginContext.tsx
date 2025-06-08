import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import {deleteCookie, getCookie, setCookie} from "../Utilities/Utilities";
import {changePassword, check, getToken, login, updateProfileApi} from "../Utilities/api";
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";
import {User, LoginResponse, LoginContextType} from "../types";
import {UserProfile} from "../Dashboard/Pages/ProfilePage";

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
    const [errorType, setErrorType] = useState<'credenziali' | 'connection' | null>(null)
    const { localname } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        _check()
    }, [])

    const _check = async() => {
        try{
            if(!loading)
                setLoading(true)
            const response = await check();

            if(response){
                if(response.status === 200 && response.data && response.data.status === 200) {
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
                        navigate("/" + response.data.localname + "/Dashboard/Home")
                    }
                    if(window.location.href.includes("/login")){
                        navigate("/" + response.data.localname + "/Dashboard/Home")
                    }
                }
                if(response.status === 402){
                    _deleteAuthorized("Errore") // todo gestire errori custom
                }
                if(response.status === 401){
                    _deleteAuthorized("Accesso negato")
                }
                if(response.status === 403){
                    _deleteAuthorized("Accesso negato")
                }
                setLoading(false)
            }else{
                // TODO gestire i diversi tipi di accessi
                setAuthorized(false)
                setUser(null)
                if(!window.location.href.includes("/register") && !window.location.href.includes("/login")) {
                    navigate("/login")
                }
                setLoading(false)
            }
        }catch (error){
            console.log(error)
            if(!window.location.href.includes("/register") && !window.location.href.includes("/login")) {
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
        navigate("/login")
        return message;
    }

    const _login = async (email: string, password: string) => {
        setTransparentLoading(true)
        try {
            const response = await login(email, password);

            if(response){
                if(response.status === 200 && response.data){
                    setErrorType(null)
                    if(!authorized)
                        setAuthorized(true);
                    setCookie("token", response.data?.accessToken, response.data.time || 1)
                    setUser({name: response.data.name, email: response.data.email || "", localname: response.data.localname, idAgency: response.data.idAgency})
                    setLoading(false)
                    //console.log(getCookie("token"))
                    navigate("/" + response.data.localname + "/Dashboard/Home")
                    return

                }else if(response.status === 401){
                    console.log(response)
                    setErrorType("credenziali")
                    deleteCookie("Errore credenziali")

                }else if(response.status === 402){

                    deleteCookie("Errore credenziali")

                }else if(response.status === 403){

                    deleteCookie("Errore credenziali")

                }else{
                    console.log(response)
                    deleteCookie("Errore credenziali")

                }
            }else{
                setErrorType('connection')
            }
        } catch (error) {
            console.log("catch")
            console.log(error)
            // TODO: gestione casistiche accesso (account da confermare, abbonamento scaduto)
        }
        setTransparentLoading(false)
    }

    const changePasswordFunc = async (oldPassword: string, newPassword: string ): Promise<boolean> => {
        let status = false
        try{
            const tmp: any = await changePassword(oldPassword, newPassword);
            if(tmp.status === 200){
                status = true
            }
        }catch (error){
            console.log(error)
        }
        return status;
    }

    const updateProfileFunc = async (updateProfile: UserProfile): Promise<boolean> => {
        let status: boolean = false
        try{
            const tmp: any = await updateProfileApi(updateProfile);
            if(tmp.status === 200){
                status = true
                setUser({
                    name: updateProfile.name,
                    email: updateProfile.email,
                    address: updateProfile.address,
                    phone: updateProfile.phone,
                    localname: user?.localname || "",
                    idAgency: user?.idAgency || -1
                })
            }
        }catch (error){
            console.log(error)
        }
        return status;
    }

    const logout = () => {
        deleteCookie("token")
        setAuthorized(false)
        setUser(null)
        window.location.href = "/login"
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
        <LoginContext.Provider value={{ _login, logout, changePasswordFunc, updateProfileFunc, register, transparentLoading, loading, user, errorType }}>
            {children}
        </LoginContext.Provider>
    );
};
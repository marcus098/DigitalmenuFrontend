 import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import {deleteCookie, setCookie} from "../Utilities/Utilities";
import {changePassword, check, login, updateProfileApi} from "../Utilities/api";
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";
import {User, LoginResponse, LoginContextType} from "../types";
import {UserProfile} from "../Dashboard/Pages/ProfilePage";

export const LoginContext = createContext<LoginContextType | undefined>(undefined);

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
    const [errorType, setErrorType] = useState<'credenziali' | 'connection' | 'billing' | null>(null)
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
                        localname: response.data.localname,
                        controlsVariable: response.data.controlsVariable
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
                    setAuthorized(false)
                    setUser(null)
                    deleteCookie("token")
                    setTransparentLoading(false)
                    navigate("/login?reason=billing")
                }
                if(response.status === 401){
                    _deleteAuthorized("Accesso negato")
                }
                if(response.status === 403){
                    _deleteAuthorized("Accesso negato")
                }
                if(response.status === -1){
                    _deleteAuthorized("Accesso negato")
                }
                setLoading(false)
            }else{
                setAuthorized(false)
                setUser(null)
                if(!window.location.href.includes("/register") && !window.location.href.includes("/login")) {
                    navigate("/login")
                }
                setLoading(false)
            }
        }catch (error){
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
            if(response && response.data){
                if(response.data.status === 200){
                    setErrorType(null)
                    if(!authorized)
                        setAuthorized(true);
                    setCookie("token", response.data?.accessToken, response.data.time || 1)
                    setUser({
                        name: response.data.name,
                        email: response.data.email || "",
                        localname: response.data.localname, idAgency: response.data.idAgency,
                        controlsVariable: response.data.controlsVariable
                    })
                    setLoading(false)
                    navigate("/" + response.data.localname + "/Dashboard/Home")
                    return

                }else if(response.data.status === 401){
                    setErrorType("credenziali")
                    deleteCookie("token")

                }/*else if(response.data.status === 402){

                    deleteCookie("token")

                }else if(response.data.status === 403){

                    deleteCookie("token")

                }*/
                else if(response.data.status === 406){
                    navigate("/confirmByAdmin")
                    deleteCookie("token")

                }else if(response.data.status === 408 && response.data){
                    const code = response.data.localname
                    const id = response.data.name
                    navigate("/emailNotConfirmed/" + id + "/" + code);
                    deleteCookie("token")

                }else{
                    deleteCookie("token")
                }
            }else{
                setErrorType('connection')
            }
        } catch (error) {
            setErrorType('connection')
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
        }
        return status;
    }

    const updateProfileFunc = async (updateProfile: UserProfile): Promise<boolean> => {
        let status: boolean = false
        try{
            const tmp: any = await updateProfileApi(updateProfile);
            if(tmp.status === 200 && user){
                status = true
                setUser({
                    name: updateProfile.name,
                    email: updateProfile.email,
                    address: updateProfile.address,
                    phone: updateProfile.phone,
                    localname: user.localname || "",
                    idAgency: user.idAgency || -1,
                    controlsVariable: user.controlsVariable
                })
            }
        }catch (error){
        }
        return status;
    }

    const checkVariable = (value: number) => {
        if(!user)
            return false
        return user.controlsVariable % value === 0
    }

    const logout = () => {
        deleteCookie("token")
        setAuthorized(false)
        setUser(null)
        window.location.href = (process.env.REACT_APP_URL || "") + "/login"
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
        <LoginContext.Provider value={{ _login, logout, changePasswordFunc, updateProfileFunc, register, checkVariable, transparentLoading, loading, user, errorType }}>
            {children}
        </LoginContext.Provider>
    );
};
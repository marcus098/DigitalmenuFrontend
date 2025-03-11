import {clientInstance, instance} from "./api";

export interface RequestConfig {
    method: string;
    url: string;
    data?: any;
    headers?: {
        'Content-Type'?: string;
    };
}

interface ApiCallInterface {
    method: string;
    url: string;
    data?: any;
    isFormData?: boolean,
    fixed?: boolean
    webflux?: boolean
}

interface ClientApiCallInterface {
    method: string;
    url: string;
    data?: any;
    fixed?: boolean
    webflux?: boolean
}

const apiUrl = process.env.REACT_APP_BACKEND_URL_BASE;
const apiUrlWebflux = process.env.REACT_APP_BACKEND_WEBFLUX_URL_BASE

export const apiCall = async <T>(apiCallInterface: ApiCallInterface): Promise<T | null> => {
    let localApiUrl = apiCallInterface.webflux ? apiUrlWebflux : apiUrl;
    if (!apiCallInterface.fixed) {
        const numbers = parseInt(process.env.REACT_APP_BACKEND_NUMBER || "", 10);
        if (numbers > 0) {
            const ports: string[] = (process.env.REACT_APP_BACKEND_PORTS || "").split("|").filter(port => port !== "");

            const selectedRandom = Math.floor(Math.random() * numbers);

            localApiUrl = process.env.REACT_APP_BACKEND_URL_BASE + ports[selectedRandom];
        }
    }

    try {
        const config: RequestConfig = {
            method: apiCallInterface.method,
            url: localApiUrl + apiCallInterface.url,
            data: apiCallInterface.data
        };

        if (apiCallInterface.isFormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data'
            };
        }

        return await instance(config);
    } catch (error) {
        console.error("API call error:", error);
        return null;
    }
};

export const clientApiCall = async<T> (apiCallInterface: ClientApiCallInterface): Promise<T | null> => {
    let localApiUrl = apiCallInterface.webflux ? apiUrlWebflux : apiUrl;
    if (!apiCallInterface.fixed) {
        const numbers = parseInt(process.env.REACT_APP_BACKEND_NUMBER || "", 10);

        if (numbers > 0) {
            const ports = process.env.REACT_APP_BACKEND_PORTS || "".split("|");

            const selectedRandom = Math.floor(Math.random() * numbers); // Correzione del calcolo

            localApiUrl = process.env.REACT_APP_BACKEND_URL_BASE + ports[selectedRandom];

        }
    }

    try {
        const config = {
            method: apiCallInterface.method,
            url: localApiUrl + apiCallInterface.url,
            data: apiCallInterface.data
        };

        return await clientInstance(config);
    } catch (error) {
        // Gestione degli errori personalizzata, se necessario
        console.error("API call error:", error);
        return null;
    }
};

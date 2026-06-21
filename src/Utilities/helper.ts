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

export const apiCall = async <T>(apiCallInterface: ApiCallInterface): Promise<ApiCallResult<T>> => {
    let localApiUrl = apiCallInterface.webflux ? apiUrlWebflux : apiUrl;
    if (!apiCallInterface.fixed) {
        const numbers = parseInt(process.env.REACT_APP_BACKEND_NUMBER || "", 10);
        if (numbers > 0) {
            const ports: string[] = (process.env.REACT_APP_BACKEND_PORTS || "").split("|").filter((port: string) => port !== "");

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

        const response = await instance(config);

        const apiResponse = response.data as T

        return {
            success: response.status < 400,
            status: response.status,
            message: response.statusText,
            reloadToken: (apiResponse as any).reloadToken || null,
            newToken: (apiResponse as any).newToken || null,
            data: apiResponse,
        };
    } catch (error: any) {
        const status = error.response?.status ?? -1;
        const message = error.response?.data?.message || error.message || "Unknown error";

        return {
            success: false,
            status,
            message,
            reloadToken: false,
            data: null,
        };
    }
};


export type ApiCallResult<T> = {
    success: boolean;
    status: number;
    message?: string;
    reloadToken?: boolean;
    newToken?: string;
    data: T | null;
};


export const clientApiCall = async <T>(
    apiCallInterface: ClientApiCallInterface
): Promise<ApiCallResult<T>> => {
    let localApiUrl = apiCallInterface.webflux ? apiUrlWebflux : apiUrl;

    if (!apiCallInterface.fixed) {
        const numbers = parseInt(process.env.REACT_APP_BACKEND_NUMBER || "", 10);
        if (numbers > 0) {
            const ports = (process.env.REACT_APP_BACKEND_PORTS || "").split("|");
            const selectedRandom = Math.floor(Math.random() * numbers);
            localApiUrl = process.env.REACT_APP_BACKEND_URL_BASE + ports[selectedRandom];
        }
    }

    try {
        const config = {
            method: apiCallInterface.method,
            url: localApiUrl + apiCallInterface.url,
            data: apiCallInterface.data,
        };
        const response = await clientInstance(config);
        const apiResponse = response.data as T;
        return {
            success: response.status < 400,
            status: response.status,
            message: response.statusText,
            reloadToken: (apiResponse as any).reloadToken || false,
            newToken: (apiResponse as any).newToken || null,
            data: apiResponse,
        };
    } catch (error: any) {
        const status = error.response?.status ?? -1;
        const message = error.response?.data?.message || error.message || "Unknown error";

        return {
            success: false,
            status,
            message,
            reloadToken: false,
            data: null,
        };
    }
};

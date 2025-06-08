import axios from "axios";
import {
    AddComandWaiter,
    AddIngredient, AddTable,
    ApiResponse,
    CategoryDto, IdWithOrder,
    IngredientDto,
    ListToExport,
    LoginResponse,
    ProductDto, Response, TableDto, UpdateIngredient,
} from "../types";
import {deleteCookie, getCookie} from "./Utilities";
import {apiCall, ApiCallResult, clientApiCall} from "./helper";
import {UserProfile} from "../Dashboard/Pages/ProfilePage";
import {Comand} from "../ComandType";

const ADD_INGREDIENT = "/api/ingredients/insert";
const ADD_CATEGORY = "/api/categories/addCategory";
const ADD_PRODUCT = "/api/products/addProduct"
const ADD_TABLE = "/api/tables/addTable"
const UPDATE_INGREDIENT = "/api/ingredients/update"
const UPDATE_CATEGORY = "/api/categories/updateCategory";
const CHANGE_ORDER_CATEGORY = "/api/categories/changeOrder";
const UPDATE_TABLE = ""
const UPDATE_PRODUCT = "/api/products/updateProduct"
const UPDATE_WAITER = ""
const DELETE_INGREDIENT = (id: number) => "/api/ingredients/delete/" + id
const DELETE_CATEGORY = (idCategory: number) => "/api/categories/deleteCategory/" + idCategory;
const DELETE_PRODUCT = (idProduct: number) => "/api/products/deleteProduct/" + idProduct
const DELETE_WAITER = ""
const SET_AVAILABLE_INGREDIENT = "/api/ingredients/setAvailable"
const SET_AVAILABLE_CATEGORY = "/api/categories/setAvailable"
const SET_AVAILABLE_PRODUCT = "/api/products/setAvailable"
const UPDATE_STYLE = ""
const SET_ADDABLE_INGREDIENT = "/api/ingredients/setAddable"
const UPDATE_PROFILE = "/api/users/updateData"
const LOGIN = "/api/login"
const REGISTER_AGENCY = "/api/signupAgency"
const REGISTER_USER = "/api/signupUser"
const RECOVER_PASSWORD = "/api/recoverPassword"
const CHANGE_PASSWORD = "/api/users/changePassword"
const CLOSE_ACCOUNT = (code: string) => "/api/closeAccount/" + code
const CHANGE_EMAIL = (code: string) => "/api/changeEmail/" + code
const CHANGE_NUMBER = (code: string) => "/api/changeNumber/" + code
const SEND_ORDER = ""
const GET_ORDERS_BY_TABLE = (tableId: number) => "/api/comands/table/" + tableId
const GET_COMPLETED_ORDERS = (date: string) => "/api/comands/getCompleted/" + date
const GET_DELETED_ORDERS = (date: string) => "/api/comands/getDeleted/" + date
const SEND_WAITER_COMAND = "/api/orders/insertWaiter"
const SEND_COMAND = ""
const GET_HISOTRY_ORDERS_CLIENT = ""
const CHANGE_COMAND_STATUS = "/api/orders/changeStatus"
const GET_ALL = (idOrLocalname: string | number) =>  "/api/public/client/getAll/" + idOrLocalname
const GET_ALL_DASHBOARD = "/api/dashboard/getAll"
const CHECK = "/api/user/check"
const FREE_TABLE = (idTable: number) => "/api/tables/free/" + idTable
const FORCE_FREE_TABLE = (idTable: number) => "/api/tables/freeAndClose/" + idTable
const DELETE_TABLE = (idTable: number) => "/api/tables/delete/" + idTable
const FORCE_DELETE_TABLE = (idTable: number) => "/api/tables/deleteAndClose/" + idTable
const SET_BUSY_TABLE = (idTable: number, seats: number) => "/api/tables/takes/" + idTable + "/" + seats
export const UPDATE_ENDPOINT = (idOrLocalname: string | number) => "/api/public/updates/" + idOrLocalname
export const UPDATE_ENDPOINT_DASHBOARD = "/api/auth/admin"

const GET = 'GET'
const POST = 'POST'

export const login = async (emailUsername: string, password: string): Promise<ApiCallResult<LoginResponse>> => {
    return clientApiCall<LoginResponse>({
        method: POST,
        data: { type: "LoginUser", emailUsername, password },
        url: LOGIN,
        fixed: true,
    });
};

//export const login = async (emailUsername: string, password: string): Promise<Response<LoginResponse> | null> => {
//    return clientApiCall<Response<LoginResponse>>({method: POST, data: {type: "LoginUser", emailUsername: emailUsername, password: password}, url: LOGIN, fixed: true})
//}

export const check = async (): Promise<ApiCallResult<LoginResponse>> => {
    return apiCall<LoginResponse>({
        method: GET,
        url: CHECK,
        fixed: true,
    });
};

export const getAll = async (
    dashboard: boolean,
    idOrLocalname?: number | string
): Promise<ApiCallResult<ListToExport>> => {
    if (dashboard) {
        return apiCall<ListToExport>({
            method: GET,
            url: GET_ALL_DASHBOARD,
            fixed: true,
            webflux: true,
        });
    } else {
        return clientApiCall<ListToExport>({
            method: GET,
            url: GET_ALL(idOrLocalname || ""),
            fixed: true,
            webflux: true,
        });
    }
};

export const getComandsByTableApi = async (
    tableId: number
): Promise<ApiCallResult<Comand[]>> => {
    return apiCall<Comand[]>({
        method: GET,
        url: GET_ORDERS_BY_TABLE(tableId),
        fixed: true,
        webflux: true,
    });
};

export const getCompletedApi = async (
    date: string
): Promise<ApiCallResult<Comand[]>> => {
        return apiCall<Comand[]>({
            method: GET,
            url: GET_COMPLETED_ORDERS(date),
            fixed: true,
            webflux: true,
        });
};

export const getDeletedApi = async (
    date: string
): Promise<ApiCallResult<Comand[]>> => {
    return apiCall<Comand[]>({
        method: GET,
        url: GET_DELETED_ORDERS(date),
        fixed: true,
        webflux: true,
    });
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
    return apiCall<boolean>({method: POST, isFormData: false, url: CHANGE_PASSWORD, fixed: true, data: {type: "ChangePassword",oldPassword: oldPassword, newPassword: newPassword}})
}

export const updateProfileApi = async (updateProfile: UserProfile) => {
    const data = {
        name: updateProfile.name,
        email: updateProfile.email,
        phone: updateProfile.phone,
        address: updateProfile.address
    }
    return apiCall<boolean>({method: POST, isFormData: false, url: UPDATE_PROFILE, fixed: true, data: data})
}

export const registerAgency = async (data: FormData) => {
    data.append("type", "SignupAgency")
    return apiCall<boolean>({method: POST, isFormData: true, url: REGISTER_AGENCY, fixed: true, data: data})
}

export const addIngredientApi = async (addIngredient: AddIngredient) => {
    addIngredient.type = "AddIngredient"
    return apiCall<Response<IngredientDto>>({method: POST, url: ADD_INGREDIENT, fixed: true, data: addIngredient})
}

export const changeComandStatusApi = async (comandId: string, status: string) => {
    const data = {
        comandId: comandId,
        status: status
    }
    return apiCall<Response<IngredientDto>>({method: POST, url: CHANGE_COMAND_STATUS, fixed: true, data: data})
}

export const addCategoryApi = async (formdata: FormData) => {
    formdata.append("type", "AddCategory")
    return apiCall<Response<CategoryDto>>({method: POST, isFormData: true, url: ADD_CATEGORY, fixed: true, data: formdata})
}

export const addProductApi = async (formdata: FormData) => {
    formdata.append("type", "AddProduct")
    return apiCall<Response<ProductDto>>({method: POST, isFormData: true, url: ADD_PRODUCT, fixed: true, data: formdata})
}

export const addTableApi = async (addTable: AddTable) => {
    addTable.type = "AddTable"
    return apiCall<Response<TableDto>>({method: POST, url: ADD_TABLE, fixed: true, data: addTable})
}

export const freeTableApi = async (idTable: number) => {
    return apiCall<Response<string>>({method: GET, url: FREE_TABLE(idTable), fixed: true})
}

export const forceFreeTableApi = async (idTable: number) => {
    return apiCall<Response<string>>({method: GET, url: FORCE_FREE_TABLE(idTable), fixed: true})
}

export const deleteTableApi = async (idTable: number) => {
    return apiCall<Response<string>>({method: GET, url: DELETE_TABLE(idTable), fixed: true})
}

export const forceDeleteTableApi = async (idTable: number) => {
    return apiCall<Response<string>>({method: GET, url: FORCE_DELETE_TABLE(idTable), fixed: true})
}

export const setBusyTableApi = async (idTable: number, seats: number) => {
    return apiCall<Response<string>>({method: GET, url: SET_BUSY_TABLE(idTable, seats), fixed: true})
}

export const updateIngredientApi = async (updateIngredient: UpdateIngredient) => {
    updateIngredient.type = "UpdateIngredient"
    return apiCall<Response<IngredientDto>>({method: POST, fixed: true, data: updateIngredient, url: UPDATE_INGREDIENT})
}

export const sendWaiterComandApi = async (addComandWaiter: AddComandWaiter) => {
    addComandWaiter.type="AddComandWaiter"
    return apiCall<Response<string>>({method: POST, fixed: true, data: addComandWaiter, url: SEND_WAITER_COMAND})
}

export const updateProductApi = async (formData: FormData) => {
    formData.append("type", "UpdateProduct")
    return apiCall<Response<ProductDto>>({method: POST, fixed: true, isFormData: true, data: formData, url: UPDATE_PRODUCT})
}

export const updateCategoryApi = async (formData: FormData) => {
    formData.append("type", "UpdateCategory")
    return apiCall<Response<string>>({method: POST, fixed: true, isFormData: true, data: formData, url: UPDATE_CATEGORY})
}

export const deleteIngredientApi = async (idIngredient: number) => {
    return apiCall<Response<boolean>>({method: GET, fixed: true, url: DELETE_INGREDIENT(idIngredient)})
}

export const deleteCategoryApi = async (idCategory: number) => {
    return apiCall<Response<boolean>>({method: GET, fixed: true, url: DELETE_CATEGORY(idCategory)})
}

export const deleteProductApi = async (idProduct: number) => {
    return apiCall<Response<boolean>>({method: GET, fixed: true, url: DELETE_PRODUCT(idProduct)})
}

export const changeOrderCategoriesApi = async(ordered: IdWithOrder[]) => {
    const data = {
        type: "ChangeOrder",
        list: ordered
    }
    return apiCall<Response<boolean>>({method: POST, fixed: true, url: CHANGE_ORDER_CATEGORY, data: data})
}


export const setAvailableCategoryApi = async (idCategory: number, value: boolean) => {
    return apiCall<Response<string>>({method: GET, fixed: true, url: SET_AVAILABLE_CATEGORY + "/" + idCategory + "/" + value})
}

export const setAvailableProductApi = async (idProduct: number, value: boolean) => {
    return apiCall<Response<string>>({method: GET, fixed: true, url: SET_AVAILABLE_PRODUCT + "/" + idProduct + "/" + value})
}

export const setAvailableIngredientApi = async (idIngredient: number, value: boolean) => {
    return apiCall<Response<string>>({method: GET, fixed: true, url: SET_AVAILABLE_INGREDIENT + "/" + idIngredient + "/" + value})
}

export const setAddableIngredientApi = async (idIngredient: number, value: boolean) => {
    return apiCall<Response<string>>({method: GET, fixed: true, url: SET_ADDABLE_INGREDIENT + "/" + idIngredient + "/" + value})
}


export const getToken = (): string => {
    return getCookie('token') || ""
}

const _getKey = (): string => {
    return getCookie('key') || ""
}

export const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    //withCredentials: true
});

instance.interceptors.request.use(config => {
    const token = 'Bearer ' + getToken();
    if (process.env.REACT_APP_IS_DEMO !== "true" && token === null) {
        throw new Error("No token available");
    }
    config.headers['Authorization'] = token;
    config.headers['from'] = window.location.href;

    return config;
}, error => {
    return Promise.reject(error);
});

instance.interceptors.response.use(response => {
    // Tipizza la risposta come ApiResponse
    const apiResponse: ApiResponse = response.data;

    // Puoi aggiungere logica di validazione qui se necessario
    if (apiResponse.status >= 400) {
        throw new Error(apiResponse.message);
    }

    return {
        ...response,         // Conserva tutte le proprietà di AxiosResponse
        data: apiResponse    // Tipizza 'data' come ApiResponse<any>
    };
}, error => {
    // Posso aggiungere un trattamento degli errori qui
    return Promise.reject(error);
});


export const clientInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

clientInstance.interceptors.request.use(config => {
    config.headers['authorization'] = _getKey();
    return config;
}, error => {
    return Promise.reject(error);
});

clientInstance.interceptors.response.use(response => {
    //return response.data;
    const apiResponse: ApiResponse = response.data;
    if (apiResponse.status >= 400) {
        throw new Error(apiResponse.message);
    }

    return {
        ...response,         // Conserva tutte le proprietà di AxiosResponse
        data: apiResponse    // Tipizza 'data' come ApiResponse<any>
    };
}, error => {
    // Posso aggiungere un trattamento degli errori qui
    return Promise.reject(error);
});
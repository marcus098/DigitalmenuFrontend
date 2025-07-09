import axios from "axios";
import {
    AddCard,
    AddComandWaiter,
    AddIngredient, AddTable,
    ApiResponse, CardDto,
    CategoryDto, FileDto, FolderDto, IdWithOrder,
    IngredientDto,
    ListToExport,
    LoginResponse,
    ProductDto, Response, SignupWaiter, StyleDto, TableDto, UpdateIngredient, UpdateStyle, UpdateTables, WaiterDto,
} from "../types";
import {deleteCookie, getCookie} from "./Utilities";
import {apiCall, ApiCallResult, clientApiCall} from "./helper";
import {UserProfile} from "../Dashboard/Pages/ProfilePage";
import {Comand} from "../ComandType";

const ADD_INGREDIENT = "/api/ingredients/insert";
const ADD_CATEGORY = "/api/categories/addCategory";
const ADD_PRODUCT = "/api/products/addProduct"
const ADD_TABLE = "/api/tables/add"
const UPDATE_INGREDIENT = "/api/ingredients/update"
const UPDATE_CATEGORY = "/api/categories/updateCategory";
const CHANGE_ORDER_CATEGORY = "/api/categories/changeOrder";
const UPDATE_TABLES = "/api/tables/updateTablesPosition"
const UPDATE_SINGLE_TABLE = "/api/tables/updateTable"
const UPDATE_PRODUCT = "/api/products/updateProduct"
const GET_URL_INVITE_WAITERS = "/api/users/getInviteUrlWaiter"
const CONFIRM_WAITER = (id: number) => "/api/users/confirmWaiter/" + id.toString()
const DELETE_WAITER = (id: number) => "/api/users/deleteWaiter/" + id.toString()
const CONFIRM_EMAIL = (code: string) => "/api/users/confirmEmail/" + code
const RESEND_CONFIRM_EMAIL = (id: number, code: string) => "/api/users/resendEmailVerification/" + id + "/" + code
const GET_WAITERS = "/api/users/getWaiters"
const GET_ADMINS = "/api/users/getAdmins"
const DELETE_INGREDIENT = (id: number) => "/api/ingredients/delete/" + id
const DELETE_CATEGORY = (idCategory: number) => "/api/categories/deleteCategory/" + idCategory;
const DELETE_PRODUCT = (idProduct: number) => "/api/products/deleteProduct/" + idProduct
const SET_AVAILABLE_INGREDIENT = "/api/ingredients/setAvailable"
const SET_AVAILABLE_CATEGORY = "/api/categories/setAvailable"
const SET_AVAILABLE_PRODUCT = "/api/products/setAvailable"
const UPDATE_STYLE = "/api/style/update"
const SET_ADDABLE_INGREDIENT = "/api/ingredients/setAddable"
const UPDATE_PROFILE = "/api/users/updateData"
const LOGIN = "/api/login"
const REGISTER_AGENCY = "/api/signupAgency"
const REGISTER_WAITER = "/api/signupWaiter"
const REGISTER_USER = "/api/signupUser"
const RECOVER_PASSWORD = "/api/recoverPassword"
const CHANGE_PASSWORD = "/api/users/changePassword"
const CLOSE_ACCOUNT = (code: string) => "/api/closeAccount/" + code
const CHANGE_EMAIL = (code: string) => "/api/changeEmail/" + code
const CHANGE_NUMBER = (code: string) => "/api/changeNumber/" + code
const GET_AGENCY_NAME= (id: number) => "/api/getAgencyName/" + id
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
const INFO_CARD = (code: string) => "/api/cards/info/" + code
const RESET_CARD = (id: number) => "/api/cards/reset/" + id
const CLAIM_CARD = (id: number, quantity: number) => "/api/cards/claim/" + id + "/" + quantity
const GET_ALL_CARDS = "/api/cards/getall"
const ADD_CARD = "/api/cards/add"
const ADD_POINT_TO_CARD = (id: number, quantity: number) =>  "/api/cards/addPoints/" + id + "/" + quantity
const SEND_CARD_BY_EMAIL = (id: number, email: string) => "/api/cards/send/" + id + "/" + email
const DELETE_CARD = (id: number) => "/api/cards/delete/" + id
const GET_FILES = (folderId: number) => "/api/filemanager/files/" + folderId
const DOWNLOAD_FILE = (id: number) => "/api/filemanager/files/download/" + id
const ADD_FILE = "/api/filemanager/files/add"
const DELETE_FILE = (id: number) => "/api/filemanager/files/delete/" + id
const RENAME_FILE = (id: number, name: string) => "/api/filemanager/files/rename/" + id + "/" + name
const FORCE_DELETE_FOLDER = (id: number) => "/api/filemanager/folders/forcedelete/" + id
const DELETE_FOLDER = (id: number) => "/api/filemanager/folders/delete/" + id
const ADD_FOLDER = (name: string) => "/api/filemanager/folders/add/" + name
const RENAME_FOLDER = (id: number, name: string) => "/api/filemanager/folders/rename/" + id + "/" + name
const GET_ALL_FOLDERS = "/api/filemanager/folders/getall"

export const UPDATE_ENDPOINT = (idOrLocalname: string | number, name: boolean) => name ? "/api/public/updates?localname=" + idOrLocalname : "/api/public/updates?idAgency=" + idOrLocalname
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
    return apiCall<boolean>({method: POST, isFormData: true, url: REGISTER_AGENCY, fixed: true, data: data})
}

export const registerWaiterApi = async (data: SignupWaiter) => {
    return apiCall<boolean>({method: POST, isFormData: false, url: REGISTER_WAITER, fixed: true, data: data})
}


export const addIngredientApi = async (addIngredient: AddIngredient) => {
    addIngredient.type = "AddIngredient"
    return apiCall<Response<IngredientDto>>({method: POST, url: ADD_INGREDIENT, fixed: true, data: addIngredient})
}

export const getAgencyByIdApi = async(id: number) => {
    return apiCall<Response<string>>({method: GET, url: GET_AGENCY_NAME(id), fixed: true})
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

export const getWaitersApi = async () => {
    return apiCall<Response<WaiterDto[]>>({method: GET, url: GET_WAITERS, fixed: true})
}

export const getWaitersInviteUrlApi = async () => {
    return apiCall<Response<string>>({method: GET, url: GET_URL_INVITE_WAITERS, fixed: true})
}

export const confirmWaiterApi = async (id: number) => {
    return apiCall<Response<string>>({method: GET, url: CONFIRM_WAITER(id), fixed: true})
}

export const confirmEmailApi = async (code: string) => {
    return apiCall<Response<string>>({method: GET, url: CONFIRM_EMAIL(code), fixed: true})
}

export const resendConfirmationLinkApi = async (id: number, code: string) => {
    return apiCall<Response<string>>({method: GET, url: RESEND_CONFIRM_EMAIL(id, code), fixed: true})
}

export const deleteWaiterApi = async (id: number) => {
    return apiCall<Response<string>>({method: GET, url: DELETE_WAITER(id), fixed: true})
}

export const setBusyTableApi = async (idTable: number, seats: number) => {
    return apiCall<Response<string>>({method: GET, url: SET_BUSY_TABLE(idTable, seats), fixed: true})
}

export const updateIngredientApi = async (updateIngredient: UpdateIngredient) => {
    updateIngredient.type = "UpdateIngredient"
    return apiCall<Response<IngredientDto>>({method: POST, fixed: true, data: updateIngredient, url: UPDATE_INGREDIENT})
}

export const updateSingleTableApi = async (table: TableDto) => {
    return apiCall<Response<TableDto>>({method: POST, fixed: true, data: table, url: UPDATE_SINGLE_TABLE})
}

export const updateTablesApi = async (updateTables: UpdateTables) => {
    return apiCall<Response<TableDto[]>>({method: POST, fixed: true, data: updateTables, url: UPDATE_TABLES})
}

export const sendWaiterComandApi = async (addComandWaiter: AddComandWaiter) => {
    addComandWaiter.type="AddComandWaiter"
    return apiCall<Response<string>>({method: POST, fixed: true, data: addComandWaiter, url: SEND_WAITER_COMAND})
}

export const updateStyleApi = async (formData: FormData)=> {
    return apiCall<Response<StyleDto>>({method: POST, fixed: true, isFormData: true, data: formData, url: UPDATE_STYLE})
}

export const updateProductApi = async (formData: FormData) => {
    formData.append("type", "UpdateProduct")
    return apiCall<Response<ProductDto>>({method: POST, fixed: true, isFormData: true, data: formData, url: UPDATE_PRODUCT})
}

export const updateCategoryApi = async (formData: FormData) => {
    formData.append("type", "UpdateCategory")
    return apiCall<Response<CategoryDto>>({method: POST, fixed: true, isFormData: true, data: formData, url: UPDATE_CATEGORY})
}

export const deleteIngredientApi = async (idIngredient: number) => {
    return apiCall<Response<number[]>>({method: GET, fixed: true, url: DELETE_INGREDIENT(idIngredient)})
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

// cards
export const getInfoCardApi = async(code: string) => {
    return apiCall<Response<CardDto>>({method: GET, fixed: true, url: INFO_CARD(code)})
}

export const getAllCardsApi = async() => {
    return apiCall<Response<CardDto[]>>({method: GET, fixed: true, url: GET_ALL_CARDS})
}

export const resetCardApi = (id: number) => {
    return apiCall<Response<CardDto>>({method: GET, fixed: true, url: RESET_CARD(id)})
}

export const claimCardApi = async(id: number, quantity: number) => {
    return apiCall<Response<CardDto>>({method: GET, fixed: true, url: CLAIM_CARD(id, quantity)})
}

export const addCardApi = async(add: AddCard) => {
    return apiCall<Response<CardDto>>({method: POST, fixed: true, url: ADD_CARD, data: add})
}

export const addPointToCardApi = async(id: number, quantity: number) => {
    return apiCall<Response<CardDto>>({method: GET, fixed: true, url: ADD_POINT_TO_CARD(id, quantity)})
}

export const sendCardByEmailApi = async(id: number, email: string) => {
    return apiCall<Response<CardDto>>({method: GET, fixed: true, url: SEND_CARD_BY_EMAIL(id, email)})
}

export const deleteCardApi = async(id: number) => {
    return apiCall<Response<CardDto>>({method: GET, fixed: true, url: DELETE_CARD(id)})
}

// files
export const getFilesApi = async(folderId: number) => {
    return apiCall<Response<FileDto[]>>({method: GET, fixed: true, url: GET_FILES(folderId)})
}

export const downloadFileApi = async(id: number) => {
    return apiCall<Response<string>>({method: GET, fixed: true, url: DOWNLOAD_FILE(id)})
}

export const deleteFileApi =async (id: number) => {
    return apiCall<Response<boolean>>({method: GET, fixed: true, url: DELETE_FILE(id)})
}

export const renameFileApi = async(id: number, name: string) => {
    return apiCall<Response<FileDto>>({method: GET, fixed: true, url: RENAME_FILE(id, name)})
}

export const addFileApi = async(formData: FormData) => {
    return apiCall<Response<FileDto>>({method: POST, fixed: true, url: ADD_FILE, data: formData, isFormData: true})
}

export const forceDeleteFolderApi = (id: number) => {
    return apiCall<Response<boolean>>({method: GET, fixed: true, url: FORCE_DELETE_FOLDER(id)})
}

export const deleteFolderApi = async(id: number) => {
    return apiCall<Response<boolean>>({method: GET, fixed: true, url: DELETE_FOLDER(id)})
}

export const addFolderApi = async(name: string) => {
    return apiCall<Response<FolderDto>>({method: GET, fixed: true, url: ADD_FOLDER(name)})
}

export const renameFolderApi = async(id: number, name: string) => {
    return apiCall<Response<FolderDto>>({method: GET, fixed: true, url: RENAME_FOLDER(id, name)})
}

export const getFoldersApi = async() => {
    return apiCall<Response<FolderDto[]>>({method: GET, fixed: true, url: GET_ALL_FOLDERS})
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
    const key = _getKey()
    if(key && key.trim() !== "")
        config.headers['authorization'] = _getKey();
    return config;
}, error => {
    return Promise.reject(error);
});

clientInstance.interceptors.response.use(response => {
    //return response.data;
    const apiResponse: ApiResponse = response.data;
    if (apiResponse.status >= 400 && apiResponse.status !== 408 && apiResponse.status !== 406) {
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
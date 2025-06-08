import React from "react";
import {Comand} from "./ComandType";
import {UserProfile} from "./Dashboard/Pages/ProfilePage";
import {Orders} from "./Dashboard/Pages/OrderPage";

export interface ApiResponse<T = any>{
    status: number
    message: string
    reloadToken: boolean
    newToken?: string
    data: T
}

export interface NameType{
    id: number
    name: string
}

export interface DataContextType{
    data?: ListToExport
    waiters?: boolean
    selectedAllergens: number[]
    setSelectedAllergens: React.Dispatch<React.SetStateAction<number[]>>
    categoriesMap: Map<number, CategoryDto>
    imagesList: ImageDto[]
    productsMap: Map<number, ProductDto>
    ingredientsMap: Map<number, IngredientDto>
    comands: Comand[]
    changeComandStatus: (idComand: string, status: 'PROGRESS' | 'COMPLETED' | 'DELETED' | 'PENDING') => void
    tablesMap: Map<number, TableDto>
    styles?: StyleDto
    loading: boolean
    tagsMap: Map<number, NameType>
    allergensMap: Map<number, NameType>
    changeAvailableAddable: (entity: Entity, id: number, value: boolean, isAvailable: boolean) => Promise<boolean>
    addProduct: (addProduct: AddProduct, file?: File | null) => Promise<boolean>
    addIngredient: (addIngredient: AddIngredient) => Promise<boolean>
    addCategory: (addCategory: AddCategory, file?: File) => Promise<boolean>
    updateProduct: (updateProduct: UpdateProduct, file?: File) => Promise<boolean>
    updateCategory: (updateCategory: UpdateCategory, file?: File) => Promise<boolean>
    updateIngredient: (updateIngredient: UpdateIngredient) => Promise<boolean>
    deleteEntity: (id: number, entity: Entity) => Promise<boolean>
    changeOrderCategories: (ordered: IdWithOrder[]) => Promise<boolean>
    mapRawOrderToOrder: (hasComands?: Comand[]) => Orders[]
    forceDeleteTable: (id: number) => Promise<boolean>
    deleteTable: (id: number) => Promise<string>
    freeTableContext: (id: number) => Promise<string>
    forceFreeTableContext: (id: number) => Promise<boolean>
    setBusyTable: (id: number, seats: number) => Promise<boolean>
}

export interface Entity{
    entity: "product" | "ingredient" | "table" | "category" | "style"
}

export interface Response<T>{
    data: T
    config: any
    headers: any
    request: any
    status: number
    statusText: string
}

export interface IdWithOrder{
    id: number
    order: number
}

export interface ListToExport{
    categoriesList?:  Map<number, CategoryDto>
    ingredientsList?: Map<number, IngredientDto>
    productsList?: Map<number, ProductDto>
    tablesList?:  Map<number, TableDto>
    imagesList?: ImageDto[]
    style?: StyleDto
    comands?: Comand[]
}


export interface LoginContextType{
    loading: boolean
    user: User | null
    _login: (email: string, password: string) => void
    logout: () => void
    changePasswordFunc: (oldPassword: string, newPassword: string) => Promise<boolean>
    updateProfileFunc: (userProfile: UserProfile) => Promise<boolean>
    register: (formData: FormData) => Promise<"Success" | "Errore">
    transparentLoading: boolean
    errorType: 'credenziali' | 'connection' | null
}

export interface UtilitiesContextType{
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    goBack: () => void
    localname?: string
    loading: boolean
    transparentLoading: boolean
    setTransparentLoading: React.Dispatch<React.SetStateAction<boolean>>
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
    search: string
    screen: ScreenType
}

export interface CategoryDto{
    id: number
    name: string
    description?: string
    image?: string
    available: boolean
    products: LongInteger[]
    progressiveNumber: number
}

export interface IngredientDto{
    id: number
    name: string
    price: number
    available: boolean
    addable: boolean
    frozen: boolean
    allergens: number[]
}

export interface ProductDto{
    id: number
    name: string
    description?: string
    options: OptionInProduct[]
    image?: string
    idCategory: number
    tags: number[]
    allergens: number[]
    ingredients: number[]
    available: boolean
    positionProgressive: number
}

export interface OptionInProduct{
    name: string
    price: number
    isDefault: boolean
}

export interface ProductToOrder{
    idProduct: number
    productName: string
    idCategory: number
    categoryName: string
    productOption: OptionInProduct
    quantity: number
    ingredientsMinus: IngredientOrder[]
    ingredientsPlus: IngredientOrderPlus[]
    note: string
}

export interface AddProductToOrder{
    idProduct: number
    productOption: string
    quantity: number
    ingredientsMinus: number[]
    ingredientsPlus: number[]
    note: string
}

export interface IngredientOrder {
    id: number
    name: string
}

export interface AddComandOrder {
    products: AddProductToOrder[]
}

export interface AddComandWaiter {
    orders: AddComandOrder[]
    idTable?: number
    name?: string
    address?: string
    phone?: string
    time?: string
    comandWaiterType: "HOME" | "TABLE" | "TAKE_AWAY"
    type?: string
}

export interface IngredientOrderPlus {
    id: number
    name: string
    price: number
}

export interface StyleDto{
    facebook: string
    socialX: string
    instagram: string
    color1: string
    color2: string
    color3: string
    color4: string
    color5: string
    color6: string
    categoryStyle: string
    productStyle: string
    address: string
    publicPhone: string
    font: string
}

export interface ImageDto{
    path: string
}

export interface TableDto{
    id: number
    name: string
    seats: number
    busy: boolean
    code?: string
    x: number
    y: number
    w: number
    h: number
    location: string
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
    type: NotificationType;
    message: string;
}

export interface NotificationContextType {
    notifications: Notification[];
    addNotification: (type: NotificationType, message: string) => void;
    removeNotification: (index: number) => void;
}

export interface CustomTextBoxProps {
    value: string
    onChange: (value: string) => void
    extraCss?: string
}

export interface User {
    name: string
    localname: string
    idAgency: number
    email: string
    phone?: string
    address?: string
}

export interface LoginResponse {
    status: number
    time?: number
    localname: string
    accessToken?: string
    name: string
    surname: string
    email?: string
    isNew: boolean
    idAgency: number
}

export interface ScreenType {
    screen: "MOBILE" | "DESKTOP" | "TABLET"
}

export interface AddCategory {
    name: string
    description: string
    products: LongInteger[]
    available: boolean
    image: string
}


export interface UpdateCategory {
    id: number
    name: string
    description: string
    products: LongInteger[]
    available: boolean
    image: string
}


export interface LongInteger {
    longValue: number
    intValue: number
}

export interface AddIngredient {
    type?: string
    name: string
    available: boolean
    addable: boolean
    frozen: boolean
    price: number
    allergens: number[]
}

export interface AddTable {
    name: string
    type?: string
    location?: string
    x: number
    y: number
    w: number
    h: number
}

export interface UpdateIngredient {
    type?: string
    id: number
    name: string
    available: boolean
    addable: boolean
    frozen: boolean
    price: number
    allergens: number[]
}

export interface AddProduct {
    name: string
    description: string
    options: OptionInProduct[]
    image: string
    idCategory: number
    tags: number[]
    allergens: number[]
    ingredients: number[]
    available: boolean
}

export interface UpdateProduct {
    id: number
    name: string
    description: string
    options: OptionInProduct[]
    image: string
    idCategory: number
    tags: number[]
    allergens: number[]
    ingredients: number[]
    available: boolean
    positionProgressive: number
}

export interface CommandDto {
    id: string
    createdAt: string
    updatedAt: string
    orders: Order[]
    status: "PENDING" | "PROGRESS" | "COMPLETED" | "DELETED"
}

export interface CommandFromHomeDto extends CommandDto {
    userName: string
    userSurname: string
    userAddress: string
    dateDelivery: string
    userPhoneNumber: string
}

export interface CommandFromTableDto extends CommandDto {
    idTable: number
    userKey: string
}

export interface CommandFromTakeAwayDto extends CommandDto {
    userName: string
    userSurname: string
    userAddress: string
    dateDelivery: string
    userPhoneNumber: string
}

export interface CommandFromWaiterDto extends CommandDto {
    idTable: number
    idWaiter: number
}

export interface Order {
    id: string
    createdAt: string
    updatedAt: string
    comandId: string
    userId: string
    products: ProductToOrder[]
}

export interface ProductCard {
    id: number
    optionName: string
    ingredientsPlus: number[]
    ingredientsMinus: number[]
    quantity: number
    price: number
    note: string
}

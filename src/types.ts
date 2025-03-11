import React from "react";
import {Id} from "react-beautiful-dnd";

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
    categoriesMap: Map<number, CategoryDto>
    imagesList: ImageDto[]
    productsMap: Map<number, ProductDto>
    ingredientsMap: Map<number, IngredientDto>
    tablesMap: Map<number, TableDto>
    styles?: StyleDto
    loading: boolean
    tagsMap: Map<number, NameType>
    allergensMap: Map<number, NameType>
    changeAvailableAddable: (entity: Entity, id: number, value: boolean, isAvailable: boolean) => Promise<boolean>
    addProduct: (addProduct: AddProduct, file?: File | null) => Promise<void>
    addIngredient: (addIngredient: AddIngredient) => Promise<void>
    addCategory: (addCategory: AddCategory, file?: File) => Promise<void>
    updateProduct: (updateProduct: UpdateProduct, file?: File) => Promise<void>
    updateCategory: (updateCategory: UpdateCategory, file?: File) => Promise<void>
    updateIngredient: (updateIngredient: UpdateIngredient) => Promise<void>
    deleteEntity: (id: number, entity: Entity) => Promise<void>
    changeOrderCategories: (ordered: IdWithOrder[]) => Promise<void>

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
    categoriesList?: CategoryDto[]
    ingredientsList?: IngredientDto[]
    productsList?: ProductDto[]
    tablesList?: TableDto[]
    imagesList?: ImageDto[]
    style?: StyleDto
}


export interface LoginContextType{
    loading: boolean
    user: User | null
    _login: (email: string, password: string) => void
    logout: () => void
    changePasswordFunc: (oldPassword: string, newPassword: string) => Promise<string>
    register: (formData: FormData) => Promise<"Success" | "Errore">
    transparentLoading: boolean
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

export interface IngredientOrder {
    id: number
    name: string
}

export interface AddComandOrder {
    products: ProductToOrder[]
}

export interface AddComandWaiter {
    orders: AddComandOrder[]
    idTable: number
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
    x: number;
    y: number;
    w: number;
    h: number;
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
    name: string
    available: boolean
    addable: boolean
    frozen: boolean
    price: number
    allergens: number[]
}

export interface AddTable {
    name: string
}

export interface UpdateIngredient {
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
import React from "react";
import {Comand} from "./ComandType";
import {UserProfile} from "./Dashboard/Pages/ProfilePage";
import {Orders} from "./Dashboard/Pages/OrderPage";
import {Table} from "./Dashboard/Pages/TablesPageTest";

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
    changeOrderProducts: (ordered: IdWithOrder[], categoryId: number) => Promise<boolean>
    mapRawOrderToOrder: (hasComands?: Comand[]) => Orders[]
    forceDeleteTable: (id: number) => Promise<boolean>
    deleteTable: (id: number) => Promise<string>
    freeTableContext: (id: number) => Promise<string>
    forceFreeTableContext: (id: number) => Promise<boolean>
    setBusyTable: (id: number, seats: number) => Promise<boolean>
    updateStyle: (updateStyle: UpdateStyle, logoFile: File | null, heroFile: File | null) => Promise<boolean>
    getWaiters: () => Promise<WaiterDto[] | null>
    deleteWaiter: (id: number) => Promise<boolean>
    confirmWaiter: (id: number) => Promise<boolean>
    getWaiterInvitationUrl: () => Promise<string | null>
    addTableFunc: (addTable: AddTable) => Promise<boolean>
    updateTablesFunc: (updateTables: UpdateTables) => Promise<boolean>
    updateSingleTableFunc: (table: TableDto) => Promise<boolean>
}

export interface UpdateStyle {
    backgroundGradient: string
    cardBackground: string
    primary: string
    textBody: string
    textOnPrimary: string
    textTitle: string
    address: string
    phone: string
    facebookUrl: string
    instagramUrl: string
    heroImageUrl: string
    logoUrl: string
    restaurantName: string
    cardStyle: string
    showImages: boolean
    font: string
    description: string
    openingHours: string
    whatsapp: string
    tiktokUrl: string
    features?: string
    sectionMenuTitle?: string
    sectionBookingTitle?: string
    sectionWhyTitle?: string
    showWhyUs?: boolean
    showBooking?: boolean
    showTicker?: boolean
    landingTemplate?: string
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
    styleDto?: StyleDto
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
    errorType: 'credenziali' | 'connection' | 'billing' | null
    checkVariable: (value: number) => boolean
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
    seats?: number
    comandWaiterType: "HOME" | "TABLE" | "TAKE_AWAY"
    type?: string
}

export interface IngredientOrderPlus {
    id: number
    name: string
    price: number
}

export interface FeatureCard {
    icon: string;
    title: string;
    sub: string;
}

export interface StyleDto{
    backgroundGradient: string[],
    cardBackground: string,
    primary: string,
    textBody: string,
    textOnPrimary: string,
    textTitle: string,
    address: string,
    phone: string,
    facebookUrl: string,
    instagramUrl: string,
    heroImageUrl: string,
    logoUrl: string,
    restaurantName: string,
    cardStyle: "soft" | "rounded" | "sharp",
    showImages: boolean,
    font: string,
    description?: string,
    openingHours?: string,
    whatsapp?: string,
    tiktokUrl?: string,
    sessionUpdating?: string,
    changeType?: string,
    features?: FeatureCard[],
    sectionMenuTitle?: string,
    sectionBookingTitle?: string,
    sectionWhyTitle?: string,
    showWhyUs?: boolean,
    showBooking?: boolean,
    showTicker?: boolean,
    landingTemplate?: 'default' | 'minimal' | 'luxury' | 'strafame',
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
    controlsVariable: number
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
    controlsVariable: number
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

export interface WaiterDto {
    id: number
    name: string
    surname: string
    email: string
    phone: string
    sessionUpdating?: string
    changeType?: string
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


export type CardType = 'stamps' | 'points';

export interface LoyaltyCard {
    id: string;
    qrCodeValue: string;
    type: CardType;
    createdAt: string;

    stampsProgress?: number;
    stampsTotal?: number;

    points?: number;
}

export interface CardDto{
    id: number
    code: string
    typePoints: boolean
    actualValue: number
    scope: number
    priceForPoint: number
    qrCodeUrl: string
    createdAt: string
}

export interface AddCard {
    typePoints: boolean
    scope: number
    priceForPoint: number
}

export interface FileDto {
    id: number
    parentFolder: number
    fileName: string
    fileType: string
    createdAt: string
    fileSize: string
}

export interface FolderDto {
    id: number
    name: string
    url: string
}

export interface UpdateTables{
    id: number
    name: string
    tables: UpdateTableRow[]
}

export interface UpdateTableRow{
    x: number
    y: number
    w: number
    h: number
    id: number
}

export interface SignupWaiter {
    idAgency: number
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
    code: string
}

export interface PaymentDto {
    id: number
    idAgency: number
    idTable?: number
    comandId?: string
    amountCents: number
    currency: string
    stripePaymentIntentId?: string
    status: string
    createdAt: string
    updatedAt: string
}

export interface PaymentIntentResponse {
    clientSecret: string
    paymentIntentId: string
}

export interface ReservationDto {
    id: number
    idAgency: number
    customerName: string
    customerPhone: string
    customerEmail?: string
    partySize: number
    reservationDate: string
    reservationTime: string
    specialRequests?: string
    status: string
    createdAt: string
    updatedAt: string
}

export interface EslConfigDto {
    id: number
    tableId: number
    idAgency: number
    eslTagMac: string | null
    eslApUrl: string | null
}

// ── Group Order / Table Session ──────────────────────────────────────────────
export interface SessionClientLite {
    clientSessionId: string
    label: string
    ready: boolean
    isYou: boolean
    draftItemsCount: number
}

export type TableSessionStatus = "OPEN" | "SUBMITTED" | "CLOSED"

export interface TableSessionComandLite {
    clientSessionId: string
    comandId: string
    status: string
}

export interface TableSessionState {
    sessionId: string
    tableId: number
    tableName: string
    seats: number
    status: TableSessionStatus
    submittable: boolean
    clients: SessionClientLite[]
    comands: TableSessionComandLite[]
}

export interface TableLookup {
    tableId: number
    busy: boolean
    tableName: string
    seats?: number
    joinable?: boolean
    connectedCount?: number
    sessionId?: string
}

export interface JoinResponse {
    sessionId: string
    tableId: number
    seats: number
    status: "OPEN"
    you: SessionClientLite
    clients: SessionClientLite[]
}

export interface WaiterSessionClient {
    clientSessionId: string
    label: string
    ready: boolean
    draftOrder: AddComandOrder[]
}

export interface WaiterSessionState {
    sessionId: string
    tableId: number
    seats: number
    accessCode: string
    status: string
    clients: WaiterSessionClient[]
    comands: { clientSessionId: string; comandId: string }[]
}

export interface OpenTableSessionResponse {
    sessionId: string
    accessCode: string
    seats: number
    tableId: number
}

export const IS_ADMIN = 2;
export const IS_WAITER = 3;
export const IS_TRIAL= 5;
export const IS_EMAIL_CONFIRMED = 7;
export const IS_WAITER_CONFIRMED = 11;
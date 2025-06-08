// types/ComandDashboard.ts

export interface Ingredient {
    id: number;
    name: string;
    price?: number;
}

export interface ProductOption {
    name: string;
    price: number;
    isDefault: boolean;
}

export interface Product {
    idProduct: number;
    productName: string;
    idCategory: number;
    categoryName: string;
    productOption: ProductOption;
    quantity: number;
    ingredientsMinus: Ingredient[];
    ingredientsPlus: Ingredient[];
    note: string;
}

export interface Order {
    id: string;
    userId: string;
    products: Product[];
    status: 'PROGRESS' | 'COMPLETED' | 'DELETED' | 'AWAIT' | 'PENDING' | 'WAITING';
}

export interface Comand {
    id: string | null;
    createdAt: string;
    updatedAt: string;
    orders: Order[];
    status: 'PROGRESS' | 'COMPLETED' | 'DELETED' | 'AWAIT' | 'PENDING' | 'WAITING';
    idTable?: number
    name?: string
    idWaiter?: number
    time?: string
    phone?: string
    address?: string
    comandWaiterType?: string
    type?: string
}


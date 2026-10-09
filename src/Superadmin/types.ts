import { LoginResponse } from "../types";

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type AgencyPaymentProvider = 'NONE' | 'STRIPE' | 'SUMUP';
export type AuditAction =
    | 'IMPERSONATE_START'
    | 'IMPERSONATE_REQUEST'
    | 'SUBSCRIPTION_UPDATE'
    | 'NOTE_ADD'
    | 'NOTE_DELETE';

export interface SuperadminStats {
    agencies: number;
    active: number;
    trial: number;
    suspended: number;
    cancelled: number;
    blocked: number;
    ordersToday: number;
    ordersLast30Days: number;
}

export interface AgencySummary {
    id: number;
    name: string;
    localname: string;
    adminEmail: string | null;
    adminName: string | null;
    phone: string | null;
    createdAt: string | null;
    activeFrom: string | null; // YYYY-MM-DD
    subscriptionNumber: string | null;
    plan: string | null;
    subscriptionStatus: SubscriptionStatus;
    trial: boolean;
    trialEndAt: string | null;
    billingEndAt: string | null;
    blocked: boolean;
    paymentProvider: AgencyPaymentProvider;
    tablesCount: number;
    waitersCount: number;
    lastOrderAt: string | null;
    ordersLast30Days: number;
    notesCount: number;
    deleted: boolean;
}

export interface AgencyNote {
    id: number;
    text: string;
    authorName: string | null;
    authorEmail: string | null;
    createdAt: string;
    pinned: boolean;
}

export interface AuditEntry {
    id: number;
    superadminEmail: string;
    idAgency: number | null;
    agencyName: string | null;
    action: AuditAction;
    detail: string | null;
    ip: string | null;
    createdAt: string;
}

export interface AgencyUser {
    id: number;
    username: string;
    email: string;
    role: string;
    name: string | null;
    surname: string | null;
    confirmed: boolean;
    deleted: boolean;
}

export interface AgencyDetail {
    summary: AgencySummary;
    notes: AgencyNote[];
    audit: AuditEntry[];
    users: AgencyUser[];
}

export interface SubscriptionUpdate {
    activeFrom: string | null;
    subscriptionNumber: string | null;
    plan: string | null;
    subscriptionStatus: SubscriptionStatus;
    trial: boolean;
    trialEndAt: string | null;
    billingEndAt: string | null;
}

export interface ImpersonateResponse {
    token: string;
    expiresAt: string;
    agency: { id: number; name: string; localname: string };
    auth: LoginResponse;
}

import {apiCall, clientApiCall} from "./helper";

// Menu in più lingue — backend translationmodule (traduzione con Ollama)

export type TranslationEntity = 'CATEGORY' | 'PRODUCT' | 'INGREDIENT';
export type TranslationField = 'NAME' | 'DESCRIPTION';
export type TranslationStatus = 'OK' | 'STALE' | 'MISSING';

export interface MenuLanguage {
    code: string;
    label: string;
}

export interface TranslationSettings {
    languages: string[];
    autoTranslate: boolean;
    /** false = Ollama non configurato sul server: si può solo correggere a mano */
    aiEnabled: boolean;
    supported: MenuLanguage[];
}

export interface LanguageOverview {
    lang: string;
    total: number;
    upToDate: number;
    stale: number;
    missing: number;
    manual: number;
}

export interface TranslationJob {
    running: boolean;
    lang: string | null;
    done: number;
    total: number;
    error: string | null;
    startedAt: string | null;
    finishedAt: string | null;
}

export interface TranslationOverview {
    settings: TranslationSettings;
    languages: LanguageOverview[];
    job: TranslationJob;
}

export interface TranslationRow {
    type: TranslationEntity;
    id: number;
    field: TranslationField;
    source: string;
    translation: string | null;
    status: TranslationStatus;
    manual: boolean;
}

/** Testi tradotti del menu pubblico: tipo → id → campo → testo */
export interface PublicMenuTranslation {
    lang: string;
    texts: Partial<Record<TranslationEntity, Record<string, Partial<Record<TranslationField, string>>>>>;
}

type Wrapped<T> = { data: T };

const BASE = "/api/translations";

export const getTranslationOverviewApi = async () =>
    apiCall<Wrapped<TranslationOverview>>({method: 'GET', fixed: true, url: BASE});

export const updateTranslationSettingsApi = async (languages: string[], autoTranslate: boolean) =>
    apiCall<Wrapped<TranslationSettings>>({method: 'PUT', fixed: true, url: `${BASE}/settings`, data: {languages, autoTranslate}});

export const getTranslationRowsApi = async (lang: string) =>
    apiCall<Wrapped<TranslationRow[]>>({method: 'GET', fixed: true, url: `${BASE}/${encodeURIComponent(lang)}`});

export const startTranslationApi = async (languages?: string[]) =>
    apiCall<Wrapped<TranslationJob>>({method: 'POST', fixed: true, url: `${BASE}/start`, data: {languages: languages ?? []}});

export const saveManualTranslationApi = async (lang: string, row: Pick<TranslationRow, 'type' | 'id' | 'field'>, text: string) =>
    apiCall<Wrapped<TranslationRow>>({method: 'PUT', fixed: true, url: `${BASE}/manual`, data: {lang, ...row, text}});

// Pubbliche (menu cliente)

export const getMenuLanguagesApi = async (local: string) =>
    clientApiCall<Wrapped<MenuLanguage[]>>({method: 'GET', fixed: true, url: `/api/public/menu-translations/${encodeURIComponent(local)}`});

export const getMenuTranslationApi = async (local: string, lang: string) =>
    clientApiCall<Wrapped<PublicMenuTranslation>>({method: 'GET', fixed: true,
        url: `/api/public/menu-translations/${encodeURIComponent(local)}/${encodeURIComponent(lang)}`});

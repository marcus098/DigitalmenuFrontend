import {apiCall} from "./helper";

// Stampanti comande (non fiscali) — backend printmodule

/** TABLET_RAWBT: stampa dal tablet Android (app RawBT), nessuna coda server: solo su tocco dell'utente. */
export type PrinterType = 'STAR_CLOUDPRNT' | 'ESCPOS_BRIDGE' | 'TABLET_RAWBT';
export type PrintOn = 'CREATED' | 'ACCEPTED';
export type PrintJobStatus = 'PENDING' | 'SENT' | 'PRINTED' | 'FAILED';
export type PrintJobKind = 'NEW_ORDER' | 'REPRINT' | 'TEST';

export type PrinterDto = {
    id: string;
    name: string;
    type: PrinterType;
    macAddress?: string;
    paperWidth: number;
    charsPerLine: number;
    categoryFilter: string[];
    printOn: PrintOn;
    copies: number;
    enabled: boolean;
    lastSeenAt?: string;
    online: boolean;
    lastStatus?: string;
    tokenHint?: string;
    /** Solo nella risposta di create / regenerate-token */
    deviceToken?: string;
    /** Star: URL CloudPRNT completo (solo con deviceToken). Bridge: serverUrl per config.json. */
    setupUrl?: string;
};

export type PrinterRequest = {
    name: string;
    type: PrinterType;
    macAddress?: string;
    paperWidth: number;
    categoryFilter: string[];
    printOn: PrintOn;
    copies: number;
    enabled: boolean;
};

export type PrintJobDto = {
    id: string;
    comandId?: string;
    kind: PrintJobKind;
    status: PrintJobStatus;
    attempts: number;
    createdAt: string;
    sentAt?: string;
    printedAt?: string;
    lastError?: string;
    preview?: string;
};

const PRINTERS = "/api/printers";
const PRINTER = (id: string) => `/api/printers/${encodeURIComponent(id)}`;
const PRINTER_TOKEN = (id: string) => `${PRINTER(id)}/regenerate-token`;
const PRINTER_TEST = (id: string) => `${PRINTER(id)}/test`;
const PRINTER_JOBS = (id: string, limit: number) => `${PRINTER(id)}/jobs?limit=${limit}`;
const REPRINT = (comandId: string, printerId?: string) =>
    `/api/printers/reprint/${encodeURIComponent(comandId)}` + (printerId ? `?printerId=${encodeURIComponent(printerId)}` : "");

export const getPrintersApi = async () =>
    apiCall<PrinterDto[]>({ method: 'GET', fixed: true, url: PRINTERS });

export const createPrinterApi = async (data: PrinterRequest) =>
    apiCall<PrinterDto>({ method: 'POST', fixed: true, url: PRINTERS, data });

export const updatePrinterApi = async (id: string, data: PrinterRequest) =>
    apiCall<PrinterDto>({ method: 'PUT', fixed: true, url: PRINTER(id), data });

export const deletePrinterApi = async (id: string) =>
    apiCall<void>({ method: 'DELETE', fixed: true, url: PRINTER(id) });

export const regeneratePrinterTokenApi = async (id: string) =>
    apiCall<PrinterDto>({ method: 'POST', fixed: true, url: PRINTER_TOKEN(id) });

export const testPrinterApi = async (id: string) =>
    apiCall<PrintJobDto>({ method: 'POST', fixed: true, url: PRINTER_TEST(id) });

export const getPrinterJobsApi = async (id: string, limit = 20) =>
    apiCall<PrintJobDto[]>({ method: 'GET', fixed: true, url: PRINTER_JOBS(id, limit) });

export const reprintComandApi = async (comandId: string, printerId?: string) =>
    apiCall<{ enqueued: number }>({ method: 'POST', fixed: true, url: REPRINT(comandId, printerId) });

// ── Stampa dal tablet (RawBT) ────────────────────────────────────────────────

export type TabletStatus = {
    /** Almeno una stampante TABLET_RAWBT abilitata */
    enabled: boolean;
    /** Almeno una stampante con coda server (Star / bridge) abilitata */
    queuedPrinters: boolean;
};

export type TabletTicket = { escposBase64: string; tickets: number };

const TABLET_STATUS = "/api/printers/tablet/status";
const TABLET_TICKET = (comandId: string, reprint: boolean) =>
    `/api/printers/tablet/ticket/${encodeURIComponent(comandId)}?reprint=${reprint}`;
const TABLET_TEST = (id: string) => `${PRINTER(id)}/tablet-test`;

export const getTabletStatusApi = async () =>
    apiCall<TabletStatus>({ method: 'GET', fixed: true, url: TABLET_STATUS });

/** 200 → ticket; 204 → niente da stampare (nessuna stampante tablet / nessun prodotto); 409 → comanda non stampabile. */
export const getTabletTicketApi = async (comandId: string, reprint = false) =>
    apiCall<TabletTicket>({ method: 'GET', fixed: true, url: TABLET_TICKET(comandId, reprint) });

export const getTabletTestApi = async (id: string) =>
    apiCall<{ escposBase64: string }>({ method: 'GET', fixed: true, url: TABLET_TEST(id) });

import { clientApiCall, type ApiCallResult } from "./helper";

/** Modulo "Contattaci" del sito vetrina → POST /api/public/contact (main-app). */
export interface ContactRequestPayload {
    name: string;
    venueName: string;
    email: string;
    phone: string;
    venueType: string;
    message: string;
    privacyAccepted: boolean;
    /** Honeypot: deve restare vuoto. */
    website: string;
}

export const sendContactRequestApi = (payload: ContactRequestPayload): Promise<ApiCallResult<{ message?: string }>> =>
    clientApiCall<{ message?: string }>({
        method: "POST",
        url: "/api/public/contact",
        data: payload,
        fixed: true,
    });

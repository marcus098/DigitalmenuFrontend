export const MOBILE_WIDTH = 350

export const allergens = [
    { id: 1, name: 'Glutine', icon: '/icons/glutine.png' },
    { id: 2, name: 'Latte', icon: '/icons/latte.png' },
    { id: 3, name: 'Crostacei', icon: '/icons/crostacei.png' },
    { id: 4, name: 'Pesce', icon: '/icons/pesce.png' },
    { id: 5, name: 'Arachidi', icon: '/icons/arachidi.png' },
    { id: 6, name: 'Soia', icon: '/icons/soia.png' },
    { id: 7, name: 'Fruttia a guscio', icon: '/icons/frutta.png' },
    { id: 8, name: 'Sedano', icon: '/icons/sedano.png' },
    { id: 9, name: 'Senape', icon: '/icons/senape.png' },
    { id: 10, name: 'Semi di sesamo', icon: '/icons/sesamo.png' },
    { id: 11, name: 'Anidride solforosa', icon: '/icons/anidride.png' },
    { id: 12, name: 'Lupino', icon: '/icons/lupino.png' },
    { id: 13, name: 'Molluschi', icon: '/icons/molluschi.png' },
    { id: 14, name: 'Uova', icon: '/icons/uova.png' },
];

export const setCookie = (name: string, value: any, days: number): void => {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

// Funzione per recuperare il valore di un cookie dato il suo nome
export const getCookie = (name: string): string | null => {
    let nameEQ = name + "=";
    let cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return null;
}

// Funzione per eliminare un cookie dato il suo nome
export const deleteCookie = (name: string): void => {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
}
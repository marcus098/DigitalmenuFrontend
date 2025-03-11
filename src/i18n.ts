import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './translation/en.json';
import itTranslation from './translation/it.json';
import deTranslation from './translation/de.json';
import esTranslation from './translation/es.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enTranslation,
            },
            it: {
                translation: itTranslation,
            },
            de: {
                translation: deTranslation,
            },
            es: {
                translation: esTranslation,
            },
        },
        lng: 'it', // Lingua predefinita
        fallbackLng: 'it',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;

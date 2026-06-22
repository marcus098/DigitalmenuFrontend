import React from 'react';
import LegalLayout from './LegalLayout';
import ManageCookiesLink from '../Components/CookieConsent/ManageCookiesLink';

// SCAFFOLD allineato alle Linee guida del Garante del 10 giugno 2021.
// Aggiornare la tabella dei cookie quando si aggiungono nuovi servizi (analytics, marketing).

const CookiePolicyPage: React.FC = () => {
    return (
        <LegalLayout title="Cookie policy" lastUpdated="21 giugno 2026">
            <p>
                Questa cookie policy descrive le tipologie di cookie e di tecnologie di tracciamento simili
                utilizzate dal sito <strong>RestaurantFlow</strong> e dalle relative applicazioni web,
                in conformità alle Linee guida cookie del Garante per la protezione dei dati personali
                del 10 giugno 2021 e all'art. 122 del D.Lgs. 196/2003.
            </p>

            <h2>1. Cosa sono i cookie</h2>
            <p>
                I cookie sono piccoli file di testo che i siti web visitati inviano al terminale dell'utente,
                dove vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva.
                Tecnologie analoghe (local storage, session storage, pixel) sono assimilate ai cookie
                ai fini della presente informativa.
            </p>

            <h2>2. Tipologie di cookie utilizzati</h2>

            <h3>2.1 Cookie tecnici (sempre attivi)</h3>
            <p>
                Necessari al funzionamento del servizio. Non richiedono consenso ai sensi dell'art. 122
                Codice Privacy.
            </p>
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Finalità</th>
                        <th>Durata</th>
                        <th>Tipo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>authToken</td>
                        <td>Autenticazione utente</td>
                        <td>Sessione</td>
                        <td>localStorage</td>
                    </tr>
                    <tr>
                        <td>cart</td>
                        <td>Carrello ordini cliente</td>
                        <td>Sessione</td>
                        <td>localStorage</td>
                    </tr>
                    <tr>
                        <td>i18nextLng</td>
                        <td>Lingua dell'interfaccia</td>
                        <td>1 anno</td>
                        <td>localStorage</td>
                    </tr>
                    <tr>
                        <td>cookieConsent</td>
                        <td>Memorizza le tue preferenze cookie</td>
                        <td>12 mesi</td>
                        <td>localStorage</td>
                    </tr>
                </tbody>
            </table>

            <h3>2.2 Cookie funzionali (consenso opzionale)</h3>
            <p>
                Migliorano l'esperienza ricordando preferenze come tema, layout, ordinamenti.
                Attivabili dal banner o dalle preferenze.
            </p>

            <h3>2.3 Cookie analitici (consenso opzionale)</h3>
            <p>
                Permettono di analizzare l'utilizzo del servizio in forma aggregata per migliorarlo.
                Attualmente <strong>non sono attivi</strong> servizi di analytics di terze parti.
                Quando saranno attivati, ne verrà data informativa aggiornando questa pagina.
            </p>

            <h3>2.4 Cookie di marketing (consenso opzionale)</h3>
            <p>
                Permettono di mostrare contenuti personalizzati. Attualmente <strong>non sono attivi</strong>{' '}
                cookie di marketing di terze parti.
            </p>

            <h2>3. Cookie di terze parti</h2>
            <table>
                <thead>
                    <tr>
                        <th>Servizio</th>
                        <th>Finalità</th>
                        <th>Categoria</th>
                        <th>Informativa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Stripe</td>
                        <td>Elaborazione pagamenti — caricato solo sulle pagine di pagamento</td>
                        <td>Tecnico</td>
                        <td>
                            <a href="https://stripe.com/it/privacy" target="_blank" rel="noopener noreferrer">
                                stripe.com/privacy
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td>Google Fonts</td>
                        <td>Caricamento font tipografici</td>
                        <td>Tecnico</td>
                        <td>
                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                                policies.google.com/privacy
                            </a>
                        </td>
                    </tr>
                </tbody>
            </table>

            <h2>4. Come gestire le preferenze</h2>
            <p>
                Puoi modificare le tue preferenze cookie in qualsiasi momento tramite il pulsante qui sotto.
                La revoca del consenso è semplice quanto il rilascio.
            </p>
            <p>
                <ManageCookiesLink className="inline-flex items-center rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
                    Gestisci preferenze cookie
                </ManageCookiesLink>
            </p>

            <h3>4.1 Disabilitare i cookie dal browser</h3>
            <p>
                In alternativa puoi disabilitare i cookie direttamente dal tuo browser. Tieni presente che
                disabilitando i cookie tecnici il servizio potrebbe non funzionare correttamente.
            </p>
            <ul>
                <li>
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                        Google Chrome
                    </a>
                </li>
                <li>
                    <a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noopener noreferrer">
                        Mozilla Firefox
                    </a>
                </li>
                <li>
                    <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
                        Apple Safari
                    </a>
                </li>
                <li>
                    <a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
                        Microsoft Edge
                    </a>
                </li>
            </ul>

            <h2>5. Titolare del trattamento</h2>
            <p>
                Il titolare del trattamento dei dati raccolti tramite cookie è{' '}
                <strong>Boukhama Fatima</strong> (nome commerciale <strong>AxiomGroup</strong>),
                Via Fabio Filzi, 37 — 25128 Brescia (BS), C.F. BKHFTM99P65F258O, P.IVA 04717560983.
                Per maggiori informazioni consulta la nostra{' '}
                <a href="/privacy">informativa sulla privacy</a>.
            </p>

            <h2>6. Modifiche</h2>
            <p>
                Questa cookie policy può essere modificata in qualsiasi momento. In caso di modifiche
                sostanziali il banner di consenso verrà ripresentato per acquisire un nuovo consenso.
            </p>
        </LegalLayout>
    );
};

export default CookiePolicyPage;

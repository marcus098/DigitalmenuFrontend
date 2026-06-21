import React from 'react';
import LegalLayout from './LegalLayout';

// SCAFFOLD GDPR Art. 13/14 — i campi <span class="placeholder">[...]</span>
// vanno completati con i dati reali del titolare prima della pubblicazione.
// Si raccomanda revisione da parte di un legale specializzato in privacy.

const PrivacyPolicyPage: React.FC = () => {
    return (
        <LegalLayout title="Informativa sulla privacy" lastUpdated="21 giugno 2026">
            <p>
                La presente informativa descrive le modalità di trattamento dei dati personali degli utenti
                che utilizzano il servizio <strong>RestaurantFlow</strong> (di seguito, il "Servizio"),
                in conformità al Regolamento (UE) 2016/679 ("GDPR") e al D.Lgs. 196/2003 come modificato
                dal D.Lgs. 101/2018 ("Codice Privacy").
            </p>

            <h2>1. Titolare del trattamento</h2>
            <p>
                Il Titolare del trattamento è{' '}
                <span className="placeholder">[Ragione sociale, P.IVA, sede legale]</span>,
                contattabile all'indirizzo email{' '}
                <span className="placeholder">[privacy@axiomgroup.it]</span>.
            </p>
            <p>
                Responsabile della protezione dei dati (DPO), se nominato:{' '}
                <span className="placeholder">[Nome, contatto]</span>.
            </p>

            <h2>2. Categorie di dati trattati</h2>
            <p>A seconda dell'utilizzo del Servizio, possiamo trattare le seguenti categorie di dati:</p>
            <ul>
                <li><strong>Dati di registrazione</strong>: nome, cognome, email, password (in forma cifrata), numero di telefono.</li>
                <li><strong>Dati di gestione attività</strong>: dati del locale, menu, ordini, prenotazioni, dati dei tavoli.</li>
                <li><strong>Dati di pagamento</strong>: gestiti direttamente da Stripe Payments Europe, Ltd. — non memorizziamo i dati delle carte sui nostri server.</li>
                <li><strong>Dati di navigazione</strong>: indirizzo IP, user agent, log tecnici, cookie tecnici e — previo consenso — funzionali, analitici e di marketing.</li>
                <li><strong>Dati dei clienti finali</strong> (utenti che ordinano dal QR): numero di telefono per notifiche d'ordine (opzionale), preferenze allergeni.</li>
            </ul>

            <h2>3. Finalità e basi giuridiche</h2>
            <table>
                <thead>
                    <tr>
                        <th>Finalità</th>
                        <th>Base giuridica</th>
                        <th>Conservazione</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Erogazione del Servizio (account, ordini, dashboard)</td>
                        <td>Esecuzione del contratto (art. 6.1.b GDPR)</td>
                        <td>Durata del contratto + 10 anni (obblighi fiscali)</td>
                    </tr>
                    <tr>
                        <td>Adempimenti fiscali e amministrativi</td>
                        <td>Obbligo legale (art. 6.1.c GDPR)</td>
                        <td>10 anni (art. 2220 c.c.)</td>
                    </tr>
                    <tr>
                        <td>Sicurezza, antifrode, log tecnici</td>
                        <td>Legittimo interesse (art. 6.1.f GDPR)</td>
                        <td>12 mesi</td>
                    </tr>
                    <tr>
                        <td>Cookie funzionali / analitici / marketing</td>
                        <td>Consenso (art. 6.1.a GDPR)</td>
                        <td>Fino a revoca o massimo 12 mesi</td>
                    </tr>
                    <tr>
                        <td>Comunicazioni promozionali</td>
                        <td>Consenso (art. 6.1.a GDPR) o soft spam (art. 130.4 Codice Privacy)</td>
                        <td>Fino a revoca</td>
                    </tr>
                </tbody>
            </table>

            <h2>4. Destinatari dei dati</h2>
            <p>I dati possono essere comunicati a:</p>
            <ul>
                <li><strong>Fornitori IT</strong> in qualità di Responsabili del trattamento ex art. 28 GDPR:</li>
            </ul>
            <table>
                <thead>
                    <tr>
                        <th>Fornitore</th>
                        <th>Servizio</th>
                        <th>Sede / Trasferimento extra-UE</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Stripe Payments Europe, Ltd.</td>
                        <td>Elaborazione pagamenti</td>
                        <td>Irlanda (UE) — trasferimento USA con SCC</td>
                    </tr>
                    <tr>
                        <td>Functional Software, Inc. (Sentry)</td>
                        <td>Monitoraggio errori applicativi e performance</td>
                        <td>USA — EU-US Data Privacy Framework / SCC</td>
                    </tr>
                    <tr>
                        <td>Backblaze Inc.</td>
                        <td>Storage immagini (B2)</td>
                        <td>USA — Data Privacy Framework / SCC</td>
                    </tr>
                    <tr>
                        <td>Twilio Inc.</td>
                        <td>Invio SMS prenotazioni</td>
                        <td>USA — SCC</td>
                    </tr>
                    <tr>
                        <td><span className="placeholder">[Hosting provider]</span></td>
                        <td>Hosting applicazione e database</td>
                        <td><span className="placeholder">[Es. Hetzner — Germania, UE]</span></td>
                    </tr>
                </tbody>
            </table>
            <p>
                I dati non saranno comunicati ad altri terzi se non in adempimento di obblighi di legge
                o su richiesta delle autorità competenti.
            </p>

            <h2>5. Trasferimenti extra-UE</h2>
            <p>
                Alcuni fornitori hanno sede negli Stati Uniti. I trasferimenti avvengono sulla base di
                Clausole Contrattuali Standard approvate dalla Commissione Europea (Decisione 2021/914)
                e, ove applicabile, dell'adesione del fornitore al EU-US Data Privacy Framework.
            </p>

            <h2>6. Diritti dell'interessato</h2>
            <p>In ogni momento può esercitare i diritti previsti dagli artt. 15-22 GDPR:</p>
            <ul>
                <li>Accesso ai dati (art. 15)</li>
                <li>Rettifica (art. 16)</li>
                <li>Cancellazione / oblio (art. 17)</li>
                <li>Limitazione del trattamento (art. 18)</li>
                <li>Portabilità (art. 20)</li>
                <li>Opposizione al trattamento (art. 21)</li>
                <li>Revoca del consenso, senza pregiudizio dei trattamenti precedenti</li>
            </ul>
            <p>
                Le richieste vanno inviate a{' '}
                <span className="placeholder">[privacy@axiomgroup.it]</span>.
                Risponderemo entro 30 giorni.
            </p>
            <p>
                È inoltre suo diritto proporre reclamo al{' '}
                <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
                    Garante per la protezione dei dati personali
                </a>{' '}
                (piazza Venezia 11, 00187 Roma).
            </p>

            <h2>7. Conferimento dei dati</h2>
            <p>
                Il conferimento dei dati strettamente necessari all'erogazione del Servizio è obbligatorio:
                in mancanza non sarà possibile attivare l'account. Il conferimento dei dati per finalità
                facoltative (marketing, profilazione) è libero.
            </p>

            <h2>8. Processi decisionali automatizzati</h2>
            <p>
                Non sono effettuati trattamenti automatizzati con effetti giuridici significativi sull'interessato
                ai sensi dell'art. 22 GDPR.
            </p>

            <h2>9. Modifiche</h2>
            <p>
                La presente informativa potrà essere aggiornata. La versione vigente è sempre pubblicata
                a questa pagina con indicazione della data di ultimo aggiornamento.
            </p>
        </LegalLayout>
    );
};

export default PrivacyPolicyPage;

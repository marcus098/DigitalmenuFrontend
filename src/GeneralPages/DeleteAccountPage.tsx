import React from 'react';
import LegalLayout from './LegalLayout';

// Pagina richiesta da Google Play (sezione "Sicurezza dei dati"): spiega come chiedere
// l'eliminazione dell'account e dei dati per DineUp e per l'app DineUp Sala.

const DeleteAccountPage: React.FC = () => {
    return (
        <LegalLayout title="Eliminare l'account DineUp" lastUpdated="22 novembre 2026">
            <p>
                Questa pagina spiega come chiedere l'eliminazione del proprio account <strong>DineUp</strong>{' '}
                e dei dati collegati. Vale per il sito e per l'app <strong>DineUp Sala</strong> (sviluppatore:
                Axiom Group).
            </p>

            <h2>Come fare la richiesta</h2>
            <ol>
                <li>
                    Scrivi a{' '}
                    <a href="mailto:commerciale@axiomgroup.it?subject=Eliminazione%20account%20DineUp">commerciale@axiomgroup.it</a>{' '}
                    con oggetto "Eliminazione account DineUp", dall'indirizzo email con cui accedi.
                </li>
                <li>Indica il nome del locale e il tuo ruolo (titolare, cameriere o rider).</li>
                <li>
                    Ti rispondiamo per confermare la richiesta ed eliminiamo l'account entro 30 giorni.
                </li>
            </ol>
            <p>
                Se sei un cameriere o un rider, puoi anche chiedere al titolare del locale di rimuoverti
                dallo staff: il tuo accesso viene disattivato subito.
            </p>

            <h2>Quali dati eliminiamo</h2>
            <ul>
                <li>Nome, email, numero di telefono e password dell'account.</li>
                <li>Token per le notifiche push dei dispositivi collegati.</li>
                <li>
                    Se l'account è del titolare: dati del locale, menu, foto, tavoli, prenotazioni e tessere
                    fedeltà.
                </li>
            </ul>

            <h2>Quali dati conserviamo e per quanto</h2>
            <ul>
                <li>
                    Ordini, incassi e documenti di fatturazione necessari agli obblighi fiscali: 10 anni
                    (art. 2220 c.c.), poi vengono cancellati.
                </li>
                <li>Log tecnici di sicurezza: fino a 12 mesi.</li>
                <li>Copie di backup: vengono sovrascritte entro 30 giorni.</li>
            </ul>
        </LegalLayout>
    );
};

export default DeleteAccountPage;

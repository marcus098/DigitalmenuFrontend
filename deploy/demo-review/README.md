# Locale demo per la revisione degli store

`seed-demo.sh` crea in **produzione** il locale dimostrativo **"Trattoria Da Marco (demo)"** (slug `dineupdemo`) e
l'account con cui i revisori di Apple/Google entrano nell'app staff **DineUp Sala**. L'account è il **titolare**
(`ROLE_ADMIN`) del locale, così il revisore vede tutto: sala, comande, menu, prenotazioni e cassa.

Il contenuto è lo stesso della demo locale (`tests/screencast/demo-data.md`):

- 6 categorie (Antipasti, Primi, Secondi, Pizze, Bevande, Dolci), 22 piatti con allergeni e prezzi; la Margherita ha
  3 formati (Baby/Normale/Maxi), il "Fritto misto di mare" è **esaurito** (non compare nel menu dei clienti);
- 10 ingredienti (6 aggiungibili come extra a pagamento), collegati ai piatti come nella demo;
- 8 tavoli nella sala "Sala" (2-8 posti, 4 per fila);
- stile della vetrina, descrizione e orari "Mar-Dom 12:00-14:00 / 19:00-23:00 (chiuso il lunedi)";
- asporto a fasce di 15 minuti (lunedì chiuso) e tessere fedeltà a punti.

Indirizzo e telefono mostrati ai clienti sono **finti** (`Via Esempio 1, 00000 Città Demo (locale dimostrativo)`,
`+39 000 0000000`). Niente traduzioni del menu, prenotazioni o ordini di esempio.

## Come lanciarlo (sul server)

Serve `curl`, `docker compose` e `jq` **oppure** `python3`. Lo script usa le porte locali
(`127.0.0.1:8085` backend, `127.0.0.1:8081` webflux) e `psql` dentro il container `postgres`.

```bash
cd ~/DigitalmenuFrontend
read -rs REVIEW_PASSWORD && export REVIEW_PASSWORD     # password scelta dall'utente: non viene mai stampata
REVIEW_EMAIL=test@test.com bash deploy/demo-review/seed-demo.sh
unset REVIEW_PASSWORD
```

L'ultima riga stampata è `OK login` se il login con quelle credenziali funziona, altrimenti
`ERRORE ...` con il codice (HTTP e `status` del login) e uscita diversa da 0.

Le credenziali da dare agli store sono `REVIEW_EMAIL` + `REVIEW_PASSWORD` (Google Play Console → Accesso alle app;
App Store Connect → Informazioni per la revisione).

### Variabili

| Variabile | Default | Note |
|---|---|---|
| `REVIEW_PASSWORD` | — | **obbligatoria**, almeno 8 caratteri |
| `REVIEW_EMAIL` | `test@test.com` | account del revisore (titolare del locale demo) |
| `API` | `http://127.0.0.1:8085` | backend main-app |
| `WEBFLUX` | `http://127.0.0.1:8081` | webflux (lettura della dashboard, per sapere cosa esiste già) |
| `COMPOSE_DIR` | cartella del repo | dove lanciare `docker compose` |
| `PSQL_CMD` | `docker compose exec -T postgres sh -c 'psql -X -q -U "$POSTGRES_USER" "$POSTGRES_DB"'` | qualsiasi comando che legge SQL da stdin (es. psql nativo in sviluppo) |
| `SIGNUP_MODE` | `auto` | `auto`: registrazione via API e, se reCAPTCHA la blocca, via SQL; `api` o `sql` per forzare |
| `RESET_PASSWORD` | `0` | `1`: se l'account esiste ma la password è diversa, la reimposta a `REVIEW_PASSWORD` |

## Cosa fa, passo per passo

1. Controlla nel DB se l'email esiste già. Si ferma senza toccare niente se l'email appartiene a un **altro** locale,
   se l'utente è cancellato o non è titolare, o se lo slug `dineupdemo` è già di qualcun altro.
2. Se l'account non c'è, lo registra con `POST /api/signupAgency` (come il form del sito). Con reCAPTCHA attivo in
   produzione (`RECAPTCHA_SECRET` impostato) la registrazione senza browser riceve **403**: in quel caso crea le
   stesse righe che crea il backend (`agencies`, `users`, `styles`) via SQL, con la password cifrata in bcrypt da
   `pgcrypto` (`CREATE EXTENSION IF NOT EXISTS pgcrypto`, se manca).
3. SQL: `email_confirmed`, `number_confirmed` e `general_confirmed` a `true` (senza conferma email il login risponde
   408); nome del locale in `agencies.original_name` (lo vede il superadmin).
4. Sblocco dell'accesso (vedi sotto).
5. Login via API (senza header da browser, quindi come l'app: niente reCAPTCHA), poi crea **solo quello che manca**:
   stile e orari, ingredienti, categorie, piatti, tavoli. Fasce dell'asporto e tessere solo quando il locale viene
   creato in questo giro.
6. Login finale → `OK login`.

Rilanciarlo è sicuro: non duplica niente, non cancella niente e non rimette lo stile se è già stato impostato
(il controllo è sul nome del locale). Le password non finiscono negli argomenti dei processi né nei log: viaggiano in
file temporanei (cartella `mktemp` cancellata all'uscita) o in stdin a `psql`.

## Blocchi di abbonamento

Il login di un locale risponde **402** (app: "L'account del locale è sospeso") quando
(`SubscriptionRules.isBlocked`):

- lo stato impostato dal superadmin (`agency_admin_info.subscription_status`) è `SUSPENDED` o `CANCELLED`, oppure
- il locale **non** è in prova (`agencies.trial=false`) e `billing_end_at` è passato.

Un locale nuovo è in prova (`trial=true`, scadenza a 90 giorni) e con `trial=true` il login non viene bloccato.
Lo script, per sicurezza, imposta comunque `billing_end_at = NULL` ("nessuna scadenza") e, solo se lo stato del
superadmin è `SUSPENDED`/`CANCELLED`, lo riporta ad `ACTIVE`. Non c'è altro paywall: la dashboard e l'app non
controllano piani o pacchetti. Nel pannello superadmin il locale compare come "Prova".

## Dopo la revisione

Il locale resta attivo e visibile su `/dineupdemo`. Per disattivarlo usa il pannello superadmin (stato
`SUSPENDED`): lo script non cancella mai niente.

#!/usr/bin/env bash
# =============================================================================
# DineUp - seed del locale demo per la revisione degli store (Apple / Google)
#
# Crea (se mancano) il locale "Trattoria Da Marco (demo)" (slug dineupdemo) e
# l'account del revisore come TITOLARE (ROLE_ADMIN), poi lo stesso menu, gli
# stessi tavoli, orari e stile della demo locale (tests/screencast/demo-data.md).
#
# Idempotente: rieseguirlo non duplica nulla e non cancella mai niente.
# Requisiti: bash, curl, docker compose (per psql), jq oppure python3.
# Istruzioni: README.md nella stessa cartella.
# =============================================================================
set -euo pipefail
umask 077

# ── Parametri (variabili d'ambiente) ─────────────────────────────────────────
REVIEW_EMAIL="${REVIEW_EMAIL:-test@test.com}"
API="${API:-http://127.0.0.1:8085}"
WEBFLUX="${WEBFLUX:-http://127.0.0.1:8081}"
SLUG="${SLUG:-dineupdemo}"   # override solo per test locali
DISPLAY_NAME="Trattoria Da Marco (demo)"
OWNER_NAME="${OWNER_NAME:-Utente}"
OWNER_SURNAME="${OWNER_SURNAME:-Demo}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${COMPOSE_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
# Comando che legge SQL da stdin. Gli switch (tuple-only, ON_ERROR_STOP) li imposta lo script stesso.
PSQL_CMD="${PSQL_CMD:-docker compose exec -T postgres sh -c 'psql -X -q -U \"\$POSTGRES_USER\" \"\$POSTGRES_DB\"'}"
# auto = API (/api/signupAgency), e se reCAPTCHA la blocca (403) creazione via SQL. api | sql per forzare.
SIGNUP_MODE="${SIGNUP_MODE:-auto}"
# 1 = se l'account esiste ma la password non coincide, la reimposta a REVIEW_PASSWORD (solo per questo account)
RESET_PASSWORD="${RESET_PASSWORD:-0}"

say()  { printf '%s\n' "$*"; }
die()  { printf 'ERRORE: %s\n' "$*" >&2; exit 1; }

[ -n "${REVIEW_PASSWORD:-}" ] || die "REVIEW_PASSWORD non impostata (es. read -rs REVIEW_PASSWORD; export REVIEW_PASSWORD)"
[ "${#REVIEW_PASSWORD}" -ge 8 ] || die "REVIEW_PASSWORD troppo corta (minimo 8 caratteri)"
case "$REVIEW_PASSWORD" in *$'\n'*|*$'\r'*) die "REVIEW_PASSWORD non può contenere a capo";; esac
[[ "$REVIEW_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || die "REVIEW_EMAIL non valida: $REVIEW_EMAIL"
case "$SIGNUP_MODE" in auto|api|sql) ;; *) die "SIGNUP_MODE deve essere auto, api o sql";; esac
command -v curl >/dev/null || die "curl non trovato"

# ── JSON: jq se c'è, altrimenti python3 ──────────────────────────────────────
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"   # i file temporanei si passano a curl con percorsi relativi

if command -v jq >/dev/null 2>&1; then
    JSON=jq
else
    PY=""
    for c in python3 python; do
        if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import json' >/dev/null 2>&1; then PY="$c"; break; fi
    done
    [ -n "$PY" ] || die "servono jq oppure python3"
    JSON=py
    cat > jh.py <<'PYEOF'
import sys, json
d = json.loads(sys.stdin.buffer.read().decode('utf-8') or 'null')
op = sys.argv[1]
def out(v):
    if v is None: return
    if isinstance(v, bool): v = 'true' if v else 'false'
    sys.stdout.write(str(v))
if op == 'get':
    v = d
    for k in [p for p in sys.argv[2].split('.') if p]:
        v = v.get(k) if isinstance(v, dict) else None
    out(v)
elif op == 'findid':
    lst, name = sys.argv[2], sys.argv[3]
    cat = sys.argv[4] if len(sys.argv) > 4 else ''
    for e in (d or {}).get(lst) or []:
        o = e[1] if isinstance(e, list) else e
        if o.get('name') == name and (cat == '' or str(o.get('idCategory')) == cat):
            out(o.get(sys.argv[5]) if len(sys.argv) > 5 else o.get('id')); break
PYEOF
fi

# jget <file> <.path>      -> valore scalare (vuoto se assente)
jget() {
    if [ "$JSON" = jq ]; then jq -r "try ($2) // empty" < "$1" 2>/dev/null || true
    else "$PY" jh.py get "$2" < "$1" 2>/dev/null || true; fi
}
# jfind <file> <lista> <nome> [idCategory]  -> id dell'elemento con quel nome nella risposta di /api/dashboard/getAll
jfind() {
    if [ "$JSON" = jq ]; then
        jq -r --arg l "$2" --arg n "$3" --arg c "${4:-}" \
           '[.[$l][]? | (if type=="array" then .[1] else . end)
             | select(.name==$n and ($c=="" or ((.idCategory|tostring)==$c))) | .id][0] // empty' < "$1" 2>/dev/null || true
    else "$PY" jh.py findid "$2" "$3" ${4:+"$4"} < "$1" 2>/dev/null || true; fi
}
# jfield <file> <lista> <nome> <campo>  -> campo dell'elemento con quel nome (numeri senza ".0")
jfield() {
    local v
    if [ "$JSON" = jq ]; then
        v=$(jq -r --arg l "$2" --arg n "$3" --arg f "$4"            '[.[$l][]? | (if type=="array" then .[1] else . end) | select(.name==$n) | .[$f]][0] // empty' < "$1" 2>/dev/null || true)
    else v=$("$PY" jh.py findid "$2" "$3" "" "$4" < "$1" 2>/dev/null || true); fi
    printf '%s' "${v%.0}"
}
json_esc() { local s="$1"; s="${s//\\/\\\\}"; s="${s//\"/\\\"}"; s="${s//$'\t'/\\t}"; printf '%s' "$s"; }
rnd() { local r; r=$(LC_ALL=C tr -dc "$1" < /dev/urandom 2>/dev/null | head -c "$2") || true; printf '%s' "$r"; }
sql_esc()  { printf '%s' "${1//\'/\'\'}"; }

# ── SQL ──────────────────────────────────────────────────────────────────────
# sql < file  -> output tuple-only, campi separati da |
sql() {
    { printf '%s\n' '\set QUIET on' '\set ON_ERROR_STOP on' '\pset tuples_only on' '\pset format unaligned' "SET client_encoding TO 'UTF8';" 'SET client_min_messages TO warning;'
      cat; } > q.sql
    ( cd "$COMPOSE_DIR" && eval "$PSQL_CMD" ) < "$WORK/q.sql" | tr -d '\r'
    local rc=${PIPESTATUS[0]}
    rm -f q.sql
    return "$rc"
}

# ── HTTP ─────────────────────────────────────────────────────────────────────
# Niente header Origin/Referer/Sec-Fetch-*: il backend tratta la richiesta come l'app (login senza reCAPTCHA).
TOKEN=""
http() { # http METHOD URL [curl args...]  -> stampa il codice HTTP, corpo in ./resp
    local m="$1" u="$2"; shift 2
    local auth=()
    if [ -n "$TOKEN" ]; then printf 'Authorization: Bearer %s\n' "$TOKEN" > hdr; auth=(-H @hdr); fi
    local c
    c=$(curl -sS -o resp -w '%{http_code}' --max-time 60 -X "$m" "${auth[@]}" "$@" "$u") || true
    printf '%s' "${c:-000}"
}
body() { head -c 400 resp 2>/dev/null | tr -d '\r\n'; }

# Form multipart: i valori vanno in file (UTF-8 intatto, niente password negli argomenti dei processi)
FORM=(); FN=0
fadd() { FN=$((FN+1)); printf '%s' "$2" > "v$FN"; FORM+=(-F "$1=<v$FN"); }
freset() { FORM=(); rm -f v[0-9]*; FN=0; }

LOGIN_R=""
do_login() { # -> imposta TOKEN (vuoto se fallisce) e LOGIN_R="HTTP|status". Da chiamare SENZA $( ).
    printf '{"emailUsername":"%s","password":"%s"}' "$(json_esc "$REVIEW_EMAIL")" "$(json_esc "$REVIEW_PASSWORD")" > login.json
    TOKEN=""
    local code; code=$(http POST "$API/api/login" -H 'Content-Type: application/json' --data-binary @login.json)
    rm -f login.json
    local st; st=$(jget resp .status)
    local tok; tok=$(jget resp .accessToken)
    if [ "$code" = 200 ] && [ "$st" = 200 ] && [ -n "$tok" ] && [ "$tok" != "-1" ]; then TOKEN="$tok"; fi
    rm -f resp
    LOGIN_R="$code|${st:-?}"
}

# ── 0. Raggiungibilità ───────────────────────────────────────────────────────
code=$(http GET "$API/api/getAgencyName/0")
[ "$code" != 000 ] || die "backend non raggiungibile su $API"
sql <<< "SELECT 1;" > /dev/null || die "psql non funziona (PSQL_CMD / COMPOSE_DIR=$COMPOSE_DIR)"
say "Backend $API e database raggiungibili."

E_SQL="$(sql_esc "$REVIEW_EMAIL")"
D_SQL="$(sql_esc "$DISPLAY_NAME")"

lookup() {
    sql <<SQL
SELECT 'U|' || u.id || '|' || u.id_agency || '|' || coalesce(a.name,'') || '|' || u.role || '|' || (CASE WHEN u.deleted THEN 'DEL' ELSE 'OK' END)
  FROM users u LEFT JOIN agencies a ON a.id = u.id_agency AND NOT a.deleted
 WHERE lower(u.email) = lower('$E_SQL') ORDER BY u.deleted, u.id LIMIT 1;
SELECT 'A|' || id FROM agencies WHERE name = '$SLUG' AND NOT deleted ORDER BY id LIMIT 1;
SQL
}

# ── 1. Account e locale ──────────────────────────────────────────────────────
CREATED=0
L="$(lookup)" || die "lettura utenti/locali fallita"
U_LINE="$(grep '^U|' <<< "$L" || true)"
A_LINE="$(grep '^A|' <<< "$L" || true)"
A_ID="${A_LINE#A|}"

if [ -n "$U_LINE" ]; then
    IFS='|' read -r _ U_ID U_AG U_AGNAME U_ROLE U_DEL <<< "$U_LINE"
    [ "$U_DEL" = OK ] || die "esiste un utente CANCELLATO con email $REVIEW_EMAIL: usa un'altra REVIEW_EMAIL"
    [ "$U_AGNAME" = "$SLUG" ] || die "l'email $REVIEW_EMAIL appartiene già a un altro locale ('$U_AGNAME'): non la tocco"
    [ "$U_ROLE" = ROLE_ADMIN ] || die "l'utente $REVIEW_EMAIL esiste ma ha ruolo $U_ROLE (serve ROLE_ADMIN)"
    A_ID="$U_AG"
    say "Account e locale già presenti (utente $U_ID, locale $A_ID): salto la creazione."
else
    [ -z "$A_ID" ] || die "il locale '$SLUG' esiste già (id $A_ID) con un altro titolare: non lo tocco"
    mode="$SIGNUP_MODE"
    if [ "$mode" != sql ]; then
        freset
        fadd name "$OWNER_NAME"; fadd surname "$OWNER_SURNAME"; fadd email "$REVIEW_EMAIL"
        fadd phone ""; fadd localname "$SLUG"; fadd password "$REVIEW_PASSWORD"
        code=$(http POST "$API/api/signupAgency" "${FORM[@]}")
        freset
        if [ "$code" = 200 ]; then
            say "Registrazione via API completata."
        elif [ "$code" = 403 ] && [ "$mode" = auto ]; then
            say "Registrazione via API bloccata da reCAPTCHA (403): creo account e locale via SQL."
            mode=sql
        else
            die "registrazione via API fallita: HTTP $code $(body)"
        fi
    fi
    if [ "$mode" = sql ]; then
        W_URL="$(rnd 'A-Z0-9' 26)"
        A_URL="$(rnd 'A-Z0-9' 26)"
        OTP1="$(rnd 'A-Z0-9' 12)"
        OTP2="$(rnd 'A-Z0-9' 12)"
        TAG="pw$(rnd 'a-z' 12)"
        # Stesse righe che crea AuthService.signupAgency (agencies, users, styles); password bcrypt con pgcrypto.
        sql <<SQL > /dev/null || die "creazione via SQL fallita"
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
WITH a AS (
  INSERT INTO agencies (name, original_name, waiters_url, admins_url, created_at, deleted, packet, trial, trial_end_at, billing_end_at)
  VALUES ('$SLUG', '$D_SQL', '$W_URL', '$A_URL', now(), false, 1, true, now() + interval '90 days', now() + interval '90 days')
  RETURNING id
), u AS (
  INSERT INTO users (username, name, surname, email, password, role, id_agency, phone_number, otp_confirm_email, otp_confirm_number,
                     created_at, deleted, email_confirmed, number_confirmed, general_confirmed)
  SELECT '$SLUG', '$(sql_esc "$OWNER_NAME")', '$(sql_esc "$OWNER_SURNAME")', '$E_SQL',
         crypt(\$$TAG\$$REVIEW_PASSWORD\$$TAG\$, gen_salt('bf', 10)), 'ROLE_ADMIN', a.id, '', '$OTP1', '$OTP2',
         now(), false, true, true, true
    FROM a RETURNING id_agency
)
INSERT INTO styles (id_agency, deleted, restaurant_name, logo_url, hero_image_url, background_gradient, card_background, primary_color,
                    text_body, text_on_primary, text_title, address, phone, facebook_url, instagram_url, card_style, show_images, updated_at)
SELECT id_agency, false, '$D_SQL', '', '', '', '#FFFFFF', '#fb923c', '#6b7280', '#FFFFFF', '#1f2937', '', '', '', '', 'soft', true, now()
  FROM u;
COMMIT;
SQL
        say "Account e locale creati via SQL."
    fi
    CREATED=1
    L="$(lookup)" || die "lettura utenti/locali fallita"
    U_LINE="$(grep '^U|' <<< "$L" || true)"
    [ -n "$U_LINE" ] || die "dopo la registrazione l'utente $REVIEW_EMAIL non risulta nel database"
    IFS='|' read -r _ U_ID A_ID U_AGNAME _ _ <<< "$U_LINE"
    [ "$U_AGNAME" = "$SLUG" ] || die "il locale creato ha slug '$U_AGNAME' invece di '$SLUG'"
fi

# ── 2. Conferme e accesso (SQL) ──────────────────────────────────────────────
# - email/telefono confermati (altrimenti login 408) e general_confirmed;
# - billing_end_at = NULL ("nessuna scadenza"): il login non va mai in 402 anche se un giorno il flag trial viene tolto;
# - stato abbonamento del superadmin: se SUSPENDED/CANCELLED (login 402) torna ACTIVE.
sql <<SQL > /dev/null || die "aggiornamento dei flag fallito"
UPDATE users SET email_confirmed = true, number_confirmed = true, general_confirmed = true
 WHERE email = '$E_SQL' AND NOT deleted;
UPDATE agencies SET original_name = '$D_SQL', billing_end_at = NULL WHERE id = $A_ID;
DO \$\$ BEGIN
  IF to_regclass('public.agency_admin_info') IS NOT NULL THEN
    UPDATE agency_admin_info SET subscription_status = 'ACTIVE'
     WHERE id_agency = $A_ID AND subscription_status IN ('SUSPENDED', 'CANCELLED');
  END IF;
END \$\$;
SQL
say "Email/telefono confermati, accesso del locale sbloccato."

# ── 3. Login ─────────────────────────────────────────────────────────────────
do_login
if [ -z "$TOKEN" ] && [ "${LOGIN_R#*|}" = 401 ] && [ "$RESET_PASSWORD" = 1 ]; then
    TAG="pw$(rnd 'a-z' 12)"
    sql <<SQL > /dev/null || die "reimpostazione password fallita"
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE users SET password = crypt(\$$TAG\$$REVIEW_PASSWORD\$$TAG\$, gen_salt('bf', 10))
 WHERE email = '$E_SQL' AND NOT deleted AND id_agency = $A_ID;
SQL
    say "Password dell'account demo reimpostata (RESET_PASSWORD=1)."
    do_login
fi
[ -n "$TOKEN" ] || die "login fallito (HTTP|status = $LOGIN_R). Se l'account esisteva con un'altra password: RESET_PASSWORD=1"

dash() { # scarica la situazione del locale in ./dash.json (webflux)
    local c; c=$(http GET "$WEBFLUX/api/dashboard/getAll")
    [ "$c" = 200 ] || die "lettura dashboard fallita su $WEBFLUX: HTTP $c $(body)"
    mv resp dash.json
}
dash

# ── 4. Stile, contatti (finti) e orari ───────────────────────────────────────
if [ "$(jget dash.json .styleDto.restaurantName)" != "$DISPLAY_NAME" ] || [ "$CREATED" = 1 ]; then
    freset
    fadd backgroundGradient ""; fadd cardBackground "#FFFFFF"; fadd primary "#fb923c"
    fadd textBody "#6b7280"; fadd textOnPrimary "#FFFFFF"; fadd textTitle "#1f2937"
    fadd address "Via Esempio 1, 00000 Città Demo (locale dimostrativo)"
    fadd phone "+39 000 0000000"
    fadd facebookUrl ""; fadd instagramUrl ""; fadd heroImageUrl ""; fadd logoUrl ""
    fadd restaurantName "$DISPLAY_NAME"; fadd cardStyle "soft"; fadd showImages "true"; fadd font ""
    fadd description "Locale dimostrativo DineUp: cucina italiana casalinga, pasta fresca fatta in casa e pizza nel forno a legna. Dati e contatti di esempio."
    fadd openingHours "Mar-Dom 12:00-14:00 / 19:00-23:00 (chiuso il lunedi)"
    fadd whatsapp ""; fadd tiktokUrl ""; fadd features "[]"
    fadd sectionMenuTitle ""; fadd sectionBookingTitle ""; fadd sectionWhyTitle ""
    fadd showWhyUs "true"; fadd showBooking "true"; fadd showTicker "true"
    fadd landingTemplate "default"; fadd heroOverlayOpacity "0.35"
    code=$(http POST "$API/api/style/update" "${FORM[@]}")
    freset
    [ "$code" = 200 ] || die "aggiornamento stile fallito: HTTP $code $(body)"
    say "Stile, contatti di esempio e orari impostati."
else
    say "Stile già impostato: lo lascio com'è."
fi

# ── 5. Ingredienti ───────────────────────────────────────────────────────────
# nome|prezzo extra|aggiungibile|allergeni
INGREDIENTS=(
  "Mozzarella di bufala|2.0|true|7"
  "Prosciutto crudo|2.5|true|"
  "Funghi porcini|2.0|true|"
  "Burrata|3.0|true|7"
  "Pomodorini|0.0|false|"
  "Rucola|1.0|true|"
  "Basilico|0.0|false|"
  "Guanciale|0.0|false|"
  "Pecorino romano|0.0|false|7"
  "Uovo|1.5|true|3"
)
n=0
for row in "${INGREDIENTS[@]}"; do
    IFS='|' read -r name price addable allerg <<< "$row"
    [ -z "$(jfind dash.json ingredientsList "$name")" ] || continue
    al=""; [ -z "$allerg" ] || al="${allerg// /,}"
    printf '{"type":"AddIngredient","name":"%s","available":true,"addable":%s,"frozen":false,"price":%s,"allergens":[%s]}' \
        "$(json_esc "$name")" "$addable" "$price" "$al" > ing.json
    code=$(http POST "$API/api/ingredients/insert" -H 'Content-Type: application/json' --data-binary @ing.json)
    [ "$code" = 200 ] || die "ingrediente '$name': HTTP $code $(body)"
    n=$((n+1))
done
say "Ingredienti: $n creati, $(( ${#INGREDIENTS[@]} - n )) già presenti."

# ── 6. Categorie ─────────────────────────────────────────────────────────────
CATEGORIES=(
  "Antipasti|Per iniziare, dalla tradizione italiana"
  "Primi|Pasta fresca fatta in casa"
  "Secondi|Carne e pesce del giorno"
  "Pizze|Impasto a lunga lievitazione, cotte nel forno a legna"
  "Bevande|Vini, birre e bibite"
  "Dolci|Fatti in casa ogni mattina"
)
n=0
for row in "${CATEGORIES[@]}"; do
    IFS='|' read -r name desc <<< "$row"
    [ -z "$(jfind dash.json categoriesList "$name")" ] || continue
    freset
    fadd type AddCategory; fadd name "$name"; fadd description "$desc"; fadd available true
    code=$(http POST "$API/api/categories/addCategory" "${FORM[@]}")
    freset
    [ "$code" = 200 ] || die "categoria '$name': HTTP $code $(body)"
    n=$((n+1))
done
say "Categorie: $n create, $(( ${#CATEGORIES[@]} - n )) già presenti."
dash   # servono gli id di categorie e ingredienti

# ── 7. Prodotti (una variante "Standard" col prezzo; Margherita con 3 formati) ─
# categoria|nome|descrizione|disponibile|tag|allergeni|ingredienti (separati da ,)|varianti nome:prezzo:default (separate da ,)
PRODUCTS=(
  "Antipasti|Bruschette al pomodoro|Pane casereccio tostato, pomodorini, basilico e olio extravergine|true|1|1|Pomodorini,Basilico|Standard:6.0:true"
  "Antipasti|Tagliere di salumi e formaggi|Selezione di salumi nostrani e formaggi stagionati con miele e confetture|true||7|Prosciutto crudo|Standard:14.0:true"
  "Antipasti|Burrata con pomodorini|Burrata pugliese cremosa, pomodorini datterini e basilico fresco|true|1|7|Burrata,Pomodorini,Basilico|Standard:10.0:true"
  "Antipasti|Fritto misto di mare|Calamari, gamberi e verdure in pastella leggera|false||1 2 4 14||Standard:13.0:true"
  "Primi|Spaghetti alla carbonara|Guanciale croccante, uovo, pecorino romano e pepe nero|true||1 3 7|Guanciale,Pecorino romano,Uovo|Standard:12.0:true"
  "Primi|Tagliatelle ai funghi porcini|Pasta all'uovo fatta in casa con porcini freschi e prezzemolo|true|1|1 3|Funghi porcini|Standard:13.0:true"
  "Primi|Lasagne della nonna|Sfoglia fresca, ragù di manzo, besciamella e parmigiano|true||1 3 7 9||Standard:11.5:true"
  "Primi|Risotto allo zafferano|Carnaroli mantecato al burro con zafferano e midollo|true|1|7 9||Standard:12.5:true"
  "Secondi|Tagliata di manzo con rucola|Controfiletto di manzo, rucola, grana e aceto balsamico|true||7 12|Rucola|Standard:18.0:true"
  "Secondi|Filetto di branzino al forno|Branzino con patate al rosmarino e olive taggiasche|true||4||Standard:17.0:true"
  "Secondi|Cotoletta alla milanese|Costoletta di vitello impanata e fritta nel burro chiarificato|true||1 3 7||Standard:16.0:true"
  "Pizze|Margherita|Pomodoro San Marzano, fior di latte e basilico|true|1|1 7|Pomodorini,Basilico|Baby:5.0:false,Normale:7.0:true,Maxi:11.0:false"
  "Pizze|Diavola|Pomodoro, mozzarella e salame piccante|true||1 7||Standard:9.0:true"
  "Pizze|Bufalina|Pomodoro, mozzarella di bufala DOP e basilico|true|1|1 7|Mozzarella di bufala,Basilico|Standard:10.0:true"
  "Pizze|Capricciosa|Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi e olive|true||1 7||Standard:10.5:true"
  "Bevande|Acqua naturale 75cl|Bottiglia di vetro|true||||Standard:2.5:true"
  "Bevande|Coca-Cola 33cl|Lattina|true||||Standard:3.0:true"
  "Bevande|Birra artigianale 50cl|Bionda non filtrata del birrificio locale|true||1||Standard:6.5:true"
  "Bevande|Vino della casa (calice)|Rosso o bianco, selezione del sommelier|true||12||Standard:4.5:true"
  "Dolci|Tiramisu|Savoiardi, mascarpone, caffè e cacao amaro|true||1 3 7||Standard:6.0:true"
  "Dolci|Panna cotta ai frutti di bosco|Panna cotta vellutata con coulis di frutti di bosco|true||7||Standard:5.5:true"
  "Dolci|Cannolo siciliano|Ricotta di pecora, gocce di cioccolato e scorza d'arancia|true||1 3 7 8||Standard:5.0:true"
)
n=0
for row in "${PRODUCTS[@]}"; do
    IFS='|' read -r cat name desc avail tags allerg ingr opts <<< "$row"
    cid="$(jfind dash.json categoriesList "$cat")"
    [ -n "$cid" ] || die "categoria '$cat' non trovata"
    [ -z "$(jfind dash.json productsList "$name" "$cid")" ] || continue
    freset
    fadd type AddProduct; fadd name "$name"; fadd description "$desc"; fadd idCategory "$cid"; fadd available "$avail"
    for a in $allerg; do fadd allergens "$a"; done
    fadd traces 0
    for t in $tags; do fadd tags "$t"; done
    if [ -n "$ingr" ]; then
        IFS=',' read -r -a ilist <<< "$ingr"
        for i in "${ilist[@]}"; do
            iid="$(jfind dash.json ingredientsList "$i")"
            [ -n "$iid" ] || die "ingrediente '$i' non trovato"
            fadd ingredients "$iid"
        done
    fi
    IFS=',' read -r -a olist <<< "$opts"
    for o in "${olist[@]}"; do
        IFS=':' read -r on op od <<< "$o"
        # stesso formato del frontend: JSON con ";" al posto di "," (il backend li rimette)
        fadd options "{\"name\":\"$(json_esc "$on")\";\"price\":$op;\"isDefault\":$od}"
    done
    code=$(http POST "$API/api/products/addProduct" "${FORM[@]}")
    freset
    [ "$code" = 200 ] || die "prodotto '$name': HTTP $code $(body)"
    n=$((n+1))
done
say "Prodotti: $n creati, $(( ${#PRODUCTS[@]} - n )) già presenti."

# ── 8. Tavoli (sala "Sala", 4 per fila) ──────────────────────────────────────
# nome|x|y|posti. Il backend sceglie da solo la posizione dei tavoli nuovi: poi li sposto con updateTablesPosition.
TABLES=(
  "Tavolo 1|1|2|2" "Tavolo 2|7|2|2" "Tavolo 3|13|2|4" "Tavolo 4|19|2|4"
  "Tavolo 5|1|10|4" "Tavolo 6|7|10|6" "Tavolo 7|13|10|2" "Tavolo 8|19|10|8"
)
n=0; NEW_TABLES="|"
for row in "${TABLES[@]}"; do
    IFS='|' read -r name x y seats <<< "$row"
    [ -z "$(jfind dash.json tablesList "$name")" ] || continue
    printf '{"type":"AddTable","name":"%s","x":%s,"y":%s,"w":4,"h":4,"location":"Sala"}' "$(json_esc "$name")" "$x" "$y" > tab.json
    code=$(http POST "$API/api/tables/add" -H 'Content-Type: application/json' --data-binary @tab.json)
    [ "$code" = 200 ] || die "tavolo '$name': HTTP $code $(body)"
    n=$((n+1)); NEW_TABLES="$NEW_TABLES$name|"
done
say "Tavoli: $n creati, $(( ${#TABLES[@]} - n )) già presenti."
dash
# Posizione e posti: sui tavoli creati ora, o su quelli rimasti nella posizione automatica del backend (x=0, 3x3).
rows=""; fixed=0
for row in "${TABLES[@]}"; do
    IFS='|' read -r name x y seats <<< "$row"
    tid="$(jfind dash.json tablesList "$name")"
    [ -n "$tid" ] || die "tavolo '$name' non trovato dopo la creazione"
    cx="$(jfield dash.json tablesList "$name" x)"; cw="$(jfield dash.json tablesList "$name" w)"
    ch="$(jfield dash.json tablesList "$name" h)"; cs="$(jfield dash.json tablesList "$name" seats)"
    auto=0; [ "$cx" = 0 ] && [ "$cw" = 3 ] && [ "$ch" = 3 ] && auto=1
    case "$NEW_TABLES" in *"|$name|"*) auto=1;; esac
    [ "$auto" = 1 ] || continue
    rows="$rows${rows:+,}{\"id\":$tid,\"x\":$x,\"y\":$y,\"w\":4,\"h\":4}"
    if [ "$cs" != "$seats" ]; then
        printf '{"id":%s,"name":"%s","seats":%s,"location":"Sala"}' "$tid" "$(json_esc "$name")" "$seats" > seat.json
        code=$(http POST "$API/api/tables/updateTable" -H 'Content-Type: application/json' --data-binary @seat.json)
        [ "$code" = 200 ] || die "posti del tavolo '$name': HTTP $code $(body)"
    fi
    fixed=$((fixed+1))
done
if [ -n "$rows" ]; then
    printf '{"name":"Sala","tables":[%s]}' "$rows" > pos.json
    code=$(http POST "$API/api/tables/updateTablesPosition" -H 'Content-Type: application/json' --data-binary @pos.json)
    [ "$code" = 200 ] || die "posizione dei tavoli: HTTP $code $(body)"
fi
say "Tavoli sistemati in sala (posizione e posti): $fixed."

# ── 9. Asporto e tessere (solo alla prima creazione del locale) ──────────────
if [ "$CREATED" = 1 ]; then
    H='[{"start":"12:00","end":"14:00"},{"start":"19:00","end":"23:00"}]'
    printf '{"slotDurationMinutes":15,"maxOrdersPerSlot":5,"maxProductsPerSlot":20,"reserveOrdersPerSlot":0,"weeklyHours":{"MONDAY":[],"TUESDAY":%s,"WEDNESDAY":%s,"THURSDAY":%s,"FRIDAY":%s,"SATURDAY":%s,"SUNDAY":%s},"closedDates":[]}' \
        "$H" "$H" "$H" "$H" "$H" "$H" > slots.json
    code=$(http PUT "$API/api/takeaway/slots/config" -H 'Content-Type: application/json' --data-binary @slots.json)
    [ "$code" = 200 ] && say "Fasce orarie asporto impostate (lunedi chiuso, mar-dom 12-14 e 19-23)." \
                      || say "ATTENZIONE: fasce asporto non salvate (HTTP $code), proseguo."
    printf '%s' '{"eurosPerPoint":1.0,"pointValue":0.05,"stampsForPrize":10,"stampsPrize":"Dolce della casa in omaggio","programType":"POINTS","expiryPolicy":"NONE","expiryMonth":null,"expiryDay":null,"inactivityMonths":null,"minSpendForVisit":10.0,"oneVisitPerDay":true}' > loyalty.json
    code=$(http PUT "$API/api/cards/settings" -H 'Content-Type: application/json' --data-binary @loyalty.json)
    [ "$code" = 200 ] && say "Regole tessere fedeltà impostate." \
                      || say "ATTENZIONE: regole tessere non salvate (HTTP $code), proseguo."
fi

# ── 10. Verifica finale: login ───────────────────────────────────────────────
do_login
if [ -n "$TOKEN" ]; then
    say "OK login"
else
    say "ERRORE login (HTTP|status = $LOGIN_R)"
    exit 1
fi

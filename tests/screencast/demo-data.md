# Demo restaurant "Trattoria Da Marco" (LOCAL dev only)

Created 2026-11-06 via real API calls (+ SQL only to confirm email/phone/admin approval).
Frontend `http://localhost:5173` | main-app API `http://localhost:8085` | webflux (menu, SSE) `http://localhost:8081`

## Identity
- Agency id **3**, localname/slug **`trattoriadamarco`** (agencies.name). Display name "Trattoria Da Marco" is stored in style.restaurantName (set via /api/style/update; address, phone, description, opening hours also filled).
- Owner (ROLE_ADMIN, user id 4): `demo-owner@restaurantflow.test` / `Demo#Trattoria2026` (Marco Rossi)
- Waiter (ROLE_WAITER, user id 5): `demo-waiter@restaurantflow.test` / `Demo#Cameriere2026` (Luca Bianchi). Confirmed + approved.
- Waiter invite code (agency waitersUrl): `EED9HP3Y793620721389016064` -> invite page `/urlInvite/3/EED9HP3Y793620721389016064` (a new waiter signing up there needs email confirm + owner approval from Dashboard/Waiters; to skip email: `update users set email_confirmed=true, number_confirmed=true where email=...`).

## Login (Playwright)
- Page: `http://localhost:5173/login` -> fields `input[type=email]`, `input[type=password]`, `button[type=submit]`. Verified: both users land on `/trattoriadamarco/Dashboard/Home`.
- Token is a **cookie** `rf_token` (document.cookie, path=/, SameSite=Strict, NOT httpOnly), JWT from `POST http://localhost:8085/api/login` body `{"emailUsername","password"}` -> `{status:200, localname, accessToken, idAgency...}`. Fast login: call the API, then `context.addCookies([{name:'rf_token', value:accessToken, url:'http://localhost:5173'}])`.
- Cookie banner: suppress with `localStorage.cookieConsent = {"version":1,"timestamp":"<iso>","state":{"necessary":true,"functional":true,"analytics":false,"marketing":false}}` (addInitScript).
- Other localStorage keys: `rf_table_id`, `rf_table_session` ({sessionId,tableId,localname,joinedAt}), `rf_client_session` (uuid). Cart is in cookie `cart_*`.
- Playwright browsers are not installed for chromium; `chromium.launch({channel:'msedge'})` works. `playwright.config.ts` baseURL is :3000, the dev server is on **:5173**. `.env` REACT_APP_URL=http://localhost:3000, so QR codes in Dashboard/QRCode point to localhost:3000 (not 5173).

## URLs
| What | URL |
|---|---|
| Landing | http://localhost:5173/ |
| Signup agency | http://localhost:5173/signup |
| Login | http://localhost:5173/login |
| Owner dashboard | http://localhost:5173/trattoriadamarco/Dashboard/Home |
| Dashboard pages | `/trattoriadamarco/Dashboard/` + Menu, Categories, Ingredients, Tables (Sala), Orders, Reservations, Cassa, Cards, Slots, Layout, QRCode, Waiters, Analytics, Languages, Printers, Profile, AddProduct, AddCategory, AddIngredient |
| Waiter ordering area | http://localhost:5173/Waiters/trattoriadamarco/Categories (also `/Products/:idCategory`, `/cart`). Waiters log in at /login and land on the Dashboard; "Nuovo Ordine" buttons go to this area. Verified loads. |
| Public venue landing (vetrina) | http://localhost:5173/trattoriadamarco |
| Client menu (takeaway, no table) | http://localhost:5173/trattoriadamarco/Categories |
| Client menu for Tavolo 3 (QR link) | http://localhost:5173/trattoriadamarco/Categories?table=12 |
| Table access code page | http://localhost:5173/trattoriadamarco/table-access?table=12 |
| Other client pages | `/trattoriadamarco/cart`, `/history`, `/table-session`, `/table-live`, `/order-status/:id`, `/Products/:idCategory`, `/Product/:idProduct` |
| Public menu JSON (webflux!) | http://localhost:8081/api/public/client/getAll/trattoriadamarco (8085 returns 500 for this path) - verified 200: 6 categories, 21 products, 10 ingredients |
| Table lookup JSON | http://localhost:8085/api/public/sessions/table/12?localname=trattoriadamarco -> `{"tableId":12,"tableName":"Tavolo 3","busy":false}` |

QR link format (QRCodePage): `${REACT_APP_URL}/${localname}/Categories?table=${tableId}`.

## Client table flow (as coded)
1. Customer opens `/trattoriadamarco/Categories?table=12`. If table is not busy -> screen "Tavolo non aperto - Chiama il cameriere".
2. Staff opens the table (Dashboard/Tables -> occupy with seats = `POST /api/tables/12/session/open {"seats":N}`) -> returns 4-char `accessCode` (alphabet ABCDEFGHJKMNPQRSTUVWXYZ23456789).
3. Customer without a matching stored session is redirected to `/trattoriadamarco/table-access?table=12`, enters the 4-char code -> `POST /api/public/sessions/join {tableId,code,localname,clientSessionId}` -> localStorage `rf_table_session` + redirect to menu; then group cart / "ready" / submit (`/api/public/sessions/{id}/ready|submit`).
**WARNING: steps 2-3 are currently broken in this local env (see Bugs).** Tables are all free right now (busy=false, no code).

## Tables (agency 3, room "Sala", grid 24 cols, 4 per row)
| Name | id | seats | x,y,w,h |
|---|---|---|---|
| Tavolo 1 | 10 | 2 | 1,2,4,4 |
| Tavolo 2 | 11 | 2 | 7,2,4,4 |
| **Tavolo 3** | **12** | 4 | 13,2,4,4 |
| Tavolo 4 | 13 | 4 | 19,2,4,4 |
| Tavolo 5 | 14 | 4 | 1,10,4,4 |
| Tavolo 6 | 15 | 6 | 7,10,4,4 |
| Tavolo 7 | 16 | 2 | 13,10,4,4 |
| Tavolo 8 | 17 | 8 | 19,10,4,4 |

## Menu (every product has one option "Standard" with the price; no images)
Categories (id): Antipasti 18, Primi 19, Secondi 20, Pizze 21, Bevande 22, Dolci 23.
- Antipasti: Bruschette al pomodoro 6.00 (33, vegetariano) | Tagliere di salumi e formaggi 14.00 (34) | Burrata con pomodorini 10.00 (35) | **Fritto misto di mare 13.00 (36) = SOLD OUT (available=false)**
- Primi: Spaghetti alla carbonara 12.00 (37) | Tagliatelle ai funghi porcini 13.00 (38) | Lasagne della nonna 11.50 (39) | Risotto allo zafferano 12.50 (40)
- Secondi: Tagliata di manzo con rucola 18.00 (41) | Filetto di branzino al forno 17.00 (42) | Cotoletta alla milanese 16.00 (43)
- Pizze: Margherita 7.00 (44) | Diavola 9.00 (45) | Bufalina 10.00 (46) | Capricciosa 10.50 (47)
- Bevande: Acqua naturale 75cl 2.50 (48) | Coca-Cola 33cl 3.00 (49) | Birra artigianale 50cl 6.50 (50) | Vino della casa (calice) 4.50 (51)
- Dolci: Tiramisu 6.00 (52) | Panna cotta ai frutti di bosco 5.50 (53) | Cannolo siciliano 5.00 (54)
Allergens set on all food items (EU ids 1-14). By design the sold-out item disappears from the CLIENT menu (public catalog only has available items); it is shown as unavailable only in the dashboard.

Ingredients (id): Mozzarella di bufala 45 (+2.00 extra, addable) | Prosciutto crudo 46 (+2.50) | Funghi porcini 47 (+2.00) | Burrata 48 (+3.00) | Rucola 50 (+1.00) | Uovo 54 (+1.50) | not addable: Pomodorini 49, Basilico 51, Guanciale 52, Pecorino romano 53.
Ingredients linked: Bruschette (49,51), Burrata (48,49,51), Carbonara (52,53,54), Porcini (47), Tagliata (50), Margherita (49,51), Bufalina (45,51).

## Other data
- Reservations (staff, CONFIRMED): Giulia Verdi 4p 2026-11-06 22:00; Andrea Neri 2p 2026-11-07 20:00 (anniversary); Famiglia Conti 6p 2026-11-07 20:30 (high chair); Sara Ferrari 3p 2026-11-07 13:00.
- Loyalty (Dashboard/Cards): POINTS, 1 EUR = 1 point, point value 0.05 EUR, prize "Dolce della casa in omaggio" at 10 stamps, min spend 10 EUR, one visit/day. No cards created.
- Takeaway slots (Dashboard/Slots): 15 min, 5 orders/slot, 20 products/slot, Mon closed, Tue-Sun 12-14 & 19-23.
- No orders exist (Mongo `comand` empty for agency 3). Waiter ordering via `/api/orders/insertWaiter` does work (tested, then deleted the test comand and reset table 12).

## Bugs found
1. **Table session open and client join return 500** (blocks the QR/customer-table demo). `POST /api/tables/{id}/session/open {"seats":4}` (also as admin) -> `500 "Internal server error"` in ~60 ms, nothing written to Mongo `table_sessions`. Same for `POST /api/public/sessions/join` even against a hand-inserted OPEN session (reads work, `GET /api/public/sessions/table/13` returned joinable:true). Likely cause: `TableSessionJpa` (and `SessionClient`) is the only Mongo `@Document` using `java.time.OffsetDateTime` and there is no Mongo converter registered, so every write (insert/save) fails. No server logs available to confirm. Customer ordering at a table is therefore impossible locally; `POST /api/public/orders/insert` for a table returns 409 "Il tavolo non è aperto".
2. Legacy `GET /api/tables/takes/{id}/{seats}` (and a waiter order on a table) marks the table busy with an 8-char `code` but creates no Mongo session, so the customer then gets the access-code page with nothing to join (can't join). Dashboard "occupy table" may use this path.
3. Signup stores the OWNER'S FIRST NAME in `agencies.original_name` (signupAgency passes `signupAgency.getName()`), not the restaurant name; dashboard header and public landing show the slug (`trattoriadamarco`) until Layout/Profile sets restaurantName.
4. `/api/public/client/getAll/*` and `/api/dashboard/getAll` exist only on webflux :8081; calling them on :8085 gives 500 "Internal server error" (NoResource mapped to 500 by GlobalExceptionHandler; any unknown path returns 500 instead of 404).
5. `AddProduct` requires at least one option (variant), otherwise 400 with an empty body; curl users must send options as `{"name":..;"price":..;"isDefault":true}` using `;` instead of `,` (backend replaces ; with ,) and `--form-string` (curl `-F` treats `;` as a modifier). Non-ASCII in curl args under Git Bash got corrupted to U+FFFD (fixed via SQL for ragu and caffe); not an app bug.

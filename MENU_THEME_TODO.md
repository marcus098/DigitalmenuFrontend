# Menu Theme — Lavoro da fare

Piano di lavoro per estendere il sistema di template della landing anche alle pagine del menu cliente (Categories, Products, Product, Cart, ecc.), con personalizzazione lato proprietario.

Architettura attuale: **token CSS** iniettati da `MenuThemeProvider`, presets per i 4 template (`default`, `minimal`, `luxury`, `strafame`), pagine cliente che consumano `var(--menu-bg)`, `var(--menu-text)` ecc.

---

## ✅ Fase 1 — Foundation (in larga parte fatta)

### Fatto
- **`src/Client/menuTheme.ts`** — token type, presets per 4 template, `getMenuTokens(styles)` che applica gli override degli StyleDto esistenti.
- **`src/Components/Client/MenuThemeProvider.tsx`** — provider che inietta i token come CSS variables, aggiorna `document.body.style.backgroundColor`, carica Permanent Marker on-demand (solo template Strafame).
- **`src/App.tsx`** — `MenuThemeProvider` wrappato dentro `ClientRoutes` e `WaiterRoutes`.
- **`src/index.css`** — `.dark-input` ora usa i token; override `.font-cormorant` / `.font-nunito` per consumare i font del tema (con fallback fuori dal provider).
- **Pagine cliente migrate ai token:**
  - `Client/Pages/ClientCategoriesPage.tsx`
  - `Client/Pages/ProductsPage.tsx`
  - `Client/Pages/ClientProductPage.tsx`
  - `Client/Pages/CartPage.tsx`
- **Componenti cliente migrati ai token:**
  - `Components/Client/ClientStickyHeader.tsx`
  - `Components/Client/CategoryCard.tsx`
  - `Components/Client/ProductListItem.tsx`
  - `Components/Client/ModernCartItem.tsx`
  - `Components/Client/CategoryNavBar.tsx`

### Fase 1 completata ✅
- [x] `Client/Pages/PaymentPage.tsx` — migrato ai token
- [x] `Client/Pages/OrderStatusPage.tsx` — migrato
- [x] `Client/Pages/HistoryOrdersPage.tsx` — migrato
- [x] `Components/ProductCustomizationDrawer.tsx` — migrato (sostituito `divide-y` con `borderTop` per-child)
- [x] `Components/Client/AllergenModal.tsx` — migrato
- [x] `Components/Waiters/CartPopupWaiter.tsx` — migrato (usa `.dark-input` utility)
- [x] `Components/Client/CartIcon.tsx` — migrato (FAB usa `var(--menu-accent)`)
- [x] `index.css` — aggiunte classi `.menu-ingredient-row` e `.menu-clickable-row` per hover token-driven

Status preservati come semantici (verde "pronto", rosso errore, ecc). Stripe `colorPrimary` resta hex letterale (Elements non accetta CSS var).

---

## 🎨 Fase 2 — Look distinti per ogni template

Adesso i 4 template hanno colori/font diversi ma il **layout** del menu è identico. Per "differenziazione piena" servono variazioni di layout per template.

- [ ] **Strafame menu** — header sticky con logo hand-written (Permanent Marker), card prodotto in stile signature (badge "Speciale", border arrotondato 18px), CTA neri con hover cyan
- [ ] **Luxury menu** — griglia categorie a 2 colonne con immagine grande + accent oro, prodotti in lista minimale stile editorial
- [ ] **Minimal menu** — card categorie bianche con ombra soft, prodotti senza descrizione visibile (rivelata su hover), molto pulito
- [ ] **Default menu** — invariato (è il look attuale dark/gold), garantisce backward-compat

**Approccio:** invece di duplicare le pagine, aggiungere prop `template` ai sub-componenti (`CategoryCard`, `ProductListItem`) che varia il rendering. Oppure layer CSS condizionali via `data-template="strafame"` su un wrapping element.

---

## ⚙️ Fase 3 — Personalizzazione

Il proprietario può già modificare `primary`, `cardBackground`, `textTitle`, `textBody`, `backgroundGradient[0]` dal tab "Colori" — questi override sono cablati nei token.

Quello che manca:

- [ ] **Tab "Menu"** in `Dashboard/Pages/LayoutPage.tsx` — sezione dedicata alla personalizzazione del menu (separata da "Colori" che pilota la landing)
- [ ] **Override font** — select tra Cormorant / DM Sans / Oswald / Permanent Marker per `menuFontDisplay`. Richiede campo nuovo in `StyleDto`.
- [ ] **Override layout** — toggle: "card grandi" vs "lista compatta" per i prodotti; "griglia 2x" vs "griglia 3x" per le categorie.
- [ ] **Preview dei token effettivi** — mostrare nel dashboard una mini-anteprima della pagina Categories così l'utente vede cosa cambia in tempo reale.

**Backend (Spring Boot):** servono nuovi campi opzionali in `StyleEntity` se vogliamo persistere:
- `menuFontDisplay: String?`
- `menuCardLayout: String?` (`grid` | `list`)
- `menuCategoryColumns: Int?` (2 | 3)

Migrazione DB con default null + nullable. Non rompe nulla per locali esistenti.

---

## 🐛 Bug da verificare / chiudere

- [x] **`landingTemplate` non veniva persistito** — root cause: il backend (`Style.java`, `StyleJpa`, `StyleDto`, `UpdateStyle`, `StyleService`) non aveva il campo. Frontend lo inviava in FormData ma veniva scartato silenziosamente. Fix:
  - `common/.../model/db/Style.java` — campo + getter/setter
  - `main-app/.../stylemodule/models/StyleJpa.java` — override con `@Column("landing_template")`
  - `common/.../dto/StyleDto.java` — field, getter/setter, popolato in costruttore `StyleDto(Style)`
  - `main-app/.../stylemodule/requests/UpdateStyle.java` — field + getter/setter
  - `main-app/.../stylemodule/service/StyleService.java` — `if (updateStyle.getLandingTemplate() != null) style.setLandingTemplate(...)`
  - `StyleR2dbc` NON toccato: eredita da `Style.java`, R2DBC mappa via naming convention snake_case
  - Hibernate `ddl-auto=update` aggiunge la colonna `landing_template` automaticamente al primo deploy
  - Maven compile success su common+main-app+webflux

- [ ] **Browser dark mode** — verificato: index.html ora ha `color-scheme: light`, quindi gli input nativi non virano più scuri. Da testare su macOS in dark mode in finale.

---

## 📋 Checklist di accettazione (post Fase 1 completa)

Da provare su `/ristorantetest`:

1. ☐ Andare su `/Dashboard/Layout` → tab "Template" → scegliere ognuno dei 4 template e salvare.
2. ☐ Per ogni template aprire `/ristorantetest`: deve essere visibilmente diverso.
3. ☐ Per ogni template aprire `/ristorantetest/Categories`: deve essere visibilmente diverso (questo è il nuovo).
4. ☐ Per ogni template entrare in una categoria, in un prodotto, e nel carrello: nessuna pagina deve mostrare i vecchi colori scuri inchiodati.
5. ☐ Sul tab "Colori" cambiare `primary` da arancio a verde: deve cambiare l'accent ovunque (CTA, prezzo, pill attiva del nav, ecc.) sia in landing sia nel menu.
6. ☐ Sul tab "Colori" cambiare `cardBackground`: deve cambiare lo sfondo delle card del menu.
7. ☐ Form di prenotazione (landing) e form asporto (carrello) hanno input leggibili in tutti e 4 i template.
8. ☐ Browser in dark mode di sistema: nessun input native vira scuro nelle pagine light (minimal/strafame).

---

## File toccati nel lavoro fatto finora

```
src/App.tsx                                          (wire MenuThemeProvider)
src/Client/menuTheme.ts                              (NUOVO)
src/Components/Client/MenuThemeProvider.tsx          (NUOVO)
src/Client/Pages/ClientCategoriesPage.tsx
src/Client/Pages/ProductsPage.tsx
src/Client/Pages/ClientProductPage.tsx
src/Client/Pages/CartPage.tsx
src/Components/Client/ClientStickyHeader.tsx
src/Components/Client/CategoryCard.tsx
src/Components/Client/ProductListItem.tsx
src/Components/Client/ModernCartItem.tsx
src/Components/Client/CategoryNavBar.tsx
src/index.css
```

Plus il lavoro Strafame template della prima parte della sessione:
```
src/Client/Pages/VenueLandingPage.tsx                (Strafame template + cleanup AI-look)
src/Dashboard/Pages/LayoutPage.tsx                   (Strafame nelle opzioni template)
src/types.ts                                         ('strafame' nel literal type)
index.html                                           (color-scheme: light)
```

# 🍽️ RestaurantFlow — Sistema Gestionale Integrato per Ristoranti, Locali e Pub

**RestaurantFlow** è una piattaforma SaaS B2B all-in-one che rivoluziona la gestione di ristoranti, pub e locali. L'obiettivo è eliminare ogni attrito operativo: nessun ordine perso, nessuna comanda scritta a mano, nessun conto sbagliato. Ogni locale che adotta la piattaforma diventa più veloce, più moderno e più redditizio.

> **Nota per il team di sviluppo**: Questo documento è la specifica tecnica definitiva da seguire per la realizzazione. Tutte le scelte architetturali, di stack e di prodotto sono vincolanti salvo diversa indicazione scritta.

---

## 📋 Sommario

1. [Panoramica Generale](#panoramica-generale)
2. [Architettura del Sistema](#architettura-del-sistema)
3. [Stack Tecnologico](#stack-tecnologico)
4. [Moduli Principali](#moduli-principali)
5. [Funzionalità Dettagliate](#funzionalità-dettagliate)
6. [Infrastruttura di Stampa (Pi Zero W)](#infrastruttura-di-stampa-pi-zero-w)
7. [Etichette E-Ink per QR Dinamici (OpenEPaperLink)](#etichette-e-ink-per-qr-dinamici-openepaperlink)
8. [Setup e Installazione](#setup-e-installazione)
8. [Roadmap di Sviluppo](#roadmap-di-sviluppo)
9. [Documentazione API](#documentazione-api)
10. [Sicurezza](#sicurezza)
11. [Design & UX](#design--ux)
12. [Appendice](#appendice)

---

## 🎯 Panoramica Generale

### Visione

RestaurantFlow elimina i processi manuali tradizionali (prenotazioni cartacee, ordini a voce, conti calcolati male) trasformando l'esperienza sia dei proprietari che dei clienti attraverso:

- **QR code dinamici per tavolo** — si rigenerano ogni volta che il tavolo viene marcato come occupato; il vecchio QR diventa immediatamente inutilizzabile. Visualizzati su **etichette e-ink** wireless a batteria (anni di autonomia, zero cavi ai tavoli)
- **Gestione tavoli in tempo reale** tramite WebSocket
- **Stampa automatica commesse** su stampante termica collegata a Raspberry Pi Zero W installato nel locale
- **Ecosystem omnicanale**: ordini da tavolo, da casa, asporto, consegna
- **Dashboard proprietario** completa per analytics e gestione operativa
- **App mobile nativa** in Flutter per camerieri e clienti
- **Integrazione IA opzionale** per suggerimenti e automazioni

### Benefici Principali

| Stakeholder | Benefici |
|---|---|
| **Proprietario** | Riduzione sprechi, analytics dettagliati, gestione staff semplificata, controllo costi |
| **Camerieri** | Ordini digitali senza errori, pagamenti facilitati, meno carta |
| **Cucina** | Commesse organizzate per categoria, stampa automatica, tracciabilità |
| **Clienti** | Ordini dal tavolo via QR, menu digitale, pagamenti contactless |

---

## 🏗️ Architettura del Sistema

```
┌────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                         │
├──────────────────┬──────────────────┬──────────────────┬───────────┤
│  Web App React   │  Flutter App     │  Flutter App     │  Browser  │
│  (Proprietario)  │  (Cameriere)     │  (Cliente/Casa)  │  (QR Menu)│
└────────┬─────────┴────────┬─────────┴────────┬─────────┴─────┬─────┘
         │                  │                  │               │
         └──────────────────┴──────────────────┴───────────────┘
                                    │ HTTPS / WSS
         ┌──────────────────────────┴───────────────────────────┐
         │                    VPS (Cloud)                        │
         │                                                       │
         │  ┌───────────────────────┐  ┌──────────────────────┐ │
         │  │  Spring Boot (API)    │  │  Rust (WebSocket)    │ │
         │  │  - REST Endpoints     │  │  - Real-time ordini  │ │
         │  │  - Auth JWT           │  │  - Stato tavoli      │ │
         │  │  - Business Logic     │  │  - Notifiche cucina  │ │
         │  │  - Queue ordini       │  │  - Print trigger     │ │
         │  └───────────┬───────────┘  └──────────┬───────────┘ │
         │              │                          │             │
         │  ┌───────────┴──────────────────────────┘            │
         │  │           DATABASE LAYER                          │
         │  ├───────────────────────────────────────────────────┤
         │  │  PostgreSQL  │  Redis (Cache/Session/WS state)    │
         │  └─────────────┴───────────────────────────────────── │
         └──────────────────────────┬───────────────────────────┘
                                    │ WSS (Print Channel)
                         ┌──────────┴───────────┐
                         │  Raspberry Pi Zero W  │
                         │  (in-locale, LAN)     │
                         │  - Client WebSocket   │
                         │  - Print daemon       │
                         │  - ESC/POS driver     │
                         └──────────┬────────────┘
                                    │ USB / Serial
                              ┌─────┴──────┐
                              │ Stampante  │
                              │ Termica    │
                              │ ESC/POS    │
                              └────────────┘

                    ┌──────────────────────────────────┐
                    │  OpenEPaperLink (in-locale, LAN)  │
                    │  Access Point ESP32 (~15€)        │
                    │  - HTTP API riceve QR da VPS      │
                    │  - Radio 802.15.4 verso tag       │
                    └──────────────┬───────────────────┘
                                   │ Radio 802.15.4 (wireless)
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
        ┌────────────┐      ┌────────────┐      ┌────────────┐
        │ Tag E-Ink  │      │ Tag E-Ink  │      │ Tag E-Ink  │
        │  Tavolo 1  │      │  Tavolo 2  │      │  Tavolo N  │
        │ (batteria) │      │ (batteria) │      │ (batteria) │
        └────────────┘      └────────────┘      └────────────┘
```

---

## ⚙️ Stack Tecnologico

### Backend — VPS (Spring Boot + Rust)

| Componente | Tecnologia | Motivazione |
|---|---|---|
| **API REST** | Spring Boot (Java 21) | Maturità, ecosistema enterprise, ORM (JPA/Hibernate), sicurezza robusta |
| **WebSocket Server** | Rust (tokio + axum o actix-web) | Altissime performance con minimo overhead, gestione migliaia di connessioni concorrenti |
| **Database principale** | PostgreSQL | ACID, relazioni complesse, affidabilità produzione |
| **Cache / Sessioni** | Redis | Session storage JWT, stato WebSocket, pub/sub per eventi real-time |
| **Auth** | JWT (Spring Security) | Standard industry, stateless |
| **Queue interna ordini** | Redis Streams o RabbitMQ | Garanzia consegna commesse alla stampante |

> **Nota**: Il server Rust espone esclusivamente l'endpoint WebSocket (`/ws`). Tutta la business logic rimane in Spring Boot. I due servizi comunicano internamente via Redis pub/sub o gRPC.

### Frontend — Web

| Componente | Tecnologia |
|---|---|
| **Dashboard Proprietario** | React + TypeScript + Vite |
| **Menu Cliente (QR)** | React (PWA, no app richiesta) |
| **UI Components** | shadcn/ui o Radix UI |
| **State Management** | Zustand o React Query |
| **WebSocket Client** | Native WebSocket API |

### App Mobile

| Componente | Tecnologia |
|---|---|
| **App Cameriere** | Flutter (iOS + Android) |
| **App Cliente** | Flutter (iOS + Android) — opzionale, fase 3 |
| **State** | Riverpod o Bloc |
| **WebSocket** | `web_socket_channel` package |

> **Scelta Flutter**: unica codebase per iOS e Android, performance native, ottima per UI real-time (aggiornamenti ordini, stato tavoli). Risparmio significativo rispetto a React Native per team piccoli.

### Hardware in-locale

| Componente | Specifica |
|---|---|
| **SBC stampa** | Raspberry Pi Zero W (Wi-Fi integrato) |
| **OS** | Raspberry Pi OS Lite (headless) |
| **Stampante** | Qualsiasi termica ESC/POS USB (Epson TM-T20, Xprinter XP-58, HPRT ecc.) |
| **Connessione stampa** | Wi-Fi locale → VPS via WebSocket (WSS) |
| **Software stampa** | Python daemon (print_daemon.py) |
| **Access Point ESL** | ESP32-S3 con firmware OpenEPaperLink |
| **Etichette tavoli** | Tag e-ink Solum di seconda mano (2.9" o 4.2"), firmware OpenEPaperLink |
| **Alimentazione etichette** | Batterie CR2450 — durata anni, zero cavi ai tavoli |

---

## 📦 Moduli Principali

1. **Gestione Tavoli & QR Dinamici**
2. **Ordini & Cucina (con stampa automatica)**
3. **Pagamenti & Cassa**
4. **Pulizia Tavoli & Status**
5. **Prenotazioni**
6. **Ordini Online (Casa/Asporto)**
7. **Dashboard Proprietario**
8. **IA & Automazioni** *(opzionale, fase 2+)*

---

## 🔧 Funzionalità Dettagliate

---

### 1️⃣ MODULO GESTIONE TAVOLI & QR DINAMICI

#### 🎯 Obiettivo

Fornire un sistema sicuro e tracciabile di accesso ai tavoli mediante QR code dinamici che si rigenerano **ad ogni nuova occupazione del tavolo**, non a intervalli temporali. In questo modo il vecchio QR — eventualmente fotografato da un cliente precedente — è immediatamente inutilizzabile non appena il tavolo viene liberato e rioccupato.

#### ✨ Funzionalità

**A. Setup Tavoli (Dashboard Proprietario)**

- Configurazione numero e tipo di tavoli (capacità 2/4/6/8/10 persone)
- Assegnazione zona (interno/esterno, terrazza, VIP, bancone)
- Supporto etichette e-ink wireless per ogni tavolo (opzione consigliata) o QR stampato su portamenù come fallback economico
- Associazione tag ESL (MAC address) a ogni tavolo dalla dashboard
- Visualizzazione mappa tavoli con stato in tempo reale

**B. QR Code Dinamici — Logica di Rinnovo**

> **Decisione di prodotto**: Il QR non scade a tempo fisso. Si rigenera esclusivamente quando il tavolo passa dallo stato `OCCUPIED` → `AVAILABLE` (dopo pulizia confermata) e viene poi rioccupato con una nuova sessione.

Flusso di vita del QR:

```
[Tavolo AVAILABLE]
      │
      ▼
Cameriere marca tavolo come OCCUPIED (da app o dashboard)
      │
      ▼
Sistema genera nuova QR Session (nuovo UUID + JWT firmato)
Il vecchio QR diventa INVALID sul server
      │
      ▼
Spring Boot → HTTP POST all'Access Point OpenEPaperLink
      │
      ▼
Access Point invia nuova immagine QR via radio al tag e-ink del tavolo
Il display si aggiorna in ~2-3 secondi (senza cavi, a batteria)
      │
      ▼
[Tavolo OCCUPIED — QR attivo per questa sessione]
      │
      ▼
Cliente scansiona QR → validazione server → accesso menu
      │
      ▼
Pagamento completato → Pulizia confermata → Tavolo torna AVAILABLE
      │
      ▼
Al prossimo cliente, nuovo QR
```

Payload del QR (URL con token JWT):

```json
{
  "session_id": "uuid-v4",
  "table_id": "T001",
  "venue_id": "V001",
  "issued_at": "2025-05-02T14:30:00Z"
}
```

- Token firmato con chiave segreta server (HS256)
- Nessuna scadenza temporale: il token è valido finché la sessione è attiva nel DB
- Un solo token attivo per tavolo alla volta

**C. Flow Cliente (nessuna app richiesta)**

1. Cliente scansiona QR con fotocamera smartphone
2. Apre browser → PWA del menu del locale
3. Server valida il token (controlla `session_id` attivo, firma JWT, stato tavolo)
4. Accesso garantito al menu digitale per effettuare ordini
5. Tutti gli ordini di quella sessione sono associati al tavolo
6. Se il QR è obsoleto (sessione chiusa): messaggio "Questo QR non è più valido. Chiedi al cameriere."

> ⚠️ **Nessuna geolocalizzazione del cliente richiesta o implementata.** La validità del QR è garantita esclusivamente dalla unicità della sessione server-side.

**D. Sicurezza QR**

- Rate limiting su endpoint di validazione (max 10 req/min per IP)
- Un solo accesso attivo per sessione (first-scan wins, o multi-accesso stesso tavolo — configurabile)
- Logging completo di ogni scansione (IP, timestamp, esito)
- Invalidazione manuale dal pannello proprietario in qualsiasi momento

#### 💾 Database Schema (Tavoli)

```sql
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  table_number INT NOT NULL,
  label VARCHAR(50),            -- "T01", "Terrazza 3", ecc.
  capacity INT NOT NULL,
  zone VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','occupied','reserved','cleaning','maintenance')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE qr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES tables(id),
  token TEXT NOT NULL,          -- JWT firmato
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  scans INT DEFAULT 0
);

CREATE INDEX idx_qr_sessions_table_active ON qr_sessions(table_id, is_active);
```

---

### 2️⃣ MODULO ORDINI & CUCINA

#### 🎯 Obiettivo

Gestire il flusso ordini dal tavolo/cameriere → cucina → servizio con differenziazione per categoria, tracciabilità completa e stampa automatica su stampante termica.

#### ✨ Funzionalità

**A. Scenari di Creazione Ordine**

**Scenario 1 — Ordine da Tavolo (cliente via QR)**
- Cliente scansiona QR → menu digitale in browser
- Selezione piatti, quantità, note speciali (es. "senza cipolla")
- Finestra di modifica 3 minuti prima dell'invio definitivo
- Conferma → ordine inviato → notifica immediata a cucina via WebSocket

**Scenario 2 — Ordine da Cameriere (app Flutter)**
- App cameriere con lista tavoli occupati
- Selezione rapida piatti con quantità
- Note allergie/preferenze
- Invio diretto a cucina

**B. Routing Automatico per Categoria**

Ogni ordine viene suddiviso automaticamente per stazione:

```json
{
  "order_id": "ORD-20250502-001",
  "table_id": "T003",
  "stations": {
    "cucina": ["Bruschetta x2", "Tagliata x1"],
    "pizza": ["Margherita x2", "Diavola x1"],
    "bar": ["Mojito x2", "Birra x3"],
    "pasticceria": ["Tiramisù x1"]
  }
}
```

Ogni stazione riceve **solo la propria parte** dell'ordine, sia via WebSocket (KDS — Kitchen Display System) sia via stampa termica.

**C. Stato Ordine**

```
PENDING → RECEIVED → PREPARING → READY → SERVED → COMPLETED
                                ↓
                            CANCELLED (con motivazione)
```

Aggiornamenti di stato via WebSocket a tutti i client connessi (cliente, cameriere, cucina, dashboard).

**D. Modifica / Cancellazione**

- Entro 3 min dall'invio: cliente può modificare da browser
- Dopo 3 min: solo cameriere o proprietario può modificare (con nota obbligatoria)
- Tracking completo di ogni modifica

#### 💾 Database Schema (Ordini)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  table_id UUID REFERENCES tables(id),
  qr_session_id UUID REFERENCES qr_sessions(id),
  order_type VARCHAR(20) NOT NULL
    CHECK (order_type IN ('dine_in','takeaway','delivery','online')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','received','preparing','ready','served','completed','cancelled')),
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  item_id UUID,
  category VARCHAR(50),
  station VARCHAR(50),           -- 'pizza', 'bar', 'cucina', ecc.
  item_name VARCHAR(200),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2),
  special_notes TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','preparing','ready','served','cancelled'))
);

CREATE TABLE order_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  modified_by VARCHAR(100),
  modification_type VARCHAR(20) CHECK (modification_type IN ('add','remove','modify','cancel')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 3️⃣ MODULO PAGAMENTI & CASSA

#### 🎯 Obiettivo

Sistema di pagamento flessibile, sicuro e tracciabile con cassa digitale e riconciliazione di fine turno.

#### ✨ Funzionalità

**A. Metodi di Pagamento**

- **Da tavolo**: cliente richiede conto dalla PWA, paga con carta via Stripe (card, Apple Pay, Google Pay)
- **In cassa**: terminale Stripe/Square, contanti, buoni
- **Online**: prepagamento obbligatorio per ordini casa

**B. Flow Pagamento da Tavolo**

```
Cliente richiede conto → sistema mostra itemizzazione
      ↓
Cliente seleziona metodo pagamento
      ↓
Stripe processa il pagamento
      ↓
Ricevuta digitale via email (opzionale SMS)
      ↓
Sistema chiude la sessione QR del tavolo
      ↓
Notifica a cameriere: "Tavolo T003 — conto saldato"
      ↓
Tavolo passa a stato CLEANING
```

**C. Dashboard Cassa**

- Totale incassi giornalieri con breakdown per metodo
- Storico transazioni per turno
- Riconciliazione fine turno (cassa fisica vs digitale)
- Export PDF / CSV
- Sconti manuali (richiedono PIN proprietario con log obbligatorio)

#### 💾 Database Schema (Pagamenti)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(10,2),
  tax DECIMAL(10,2),
  payment_method VARCHAR(20) CHECK (payment_method IN ('card','cash','wallet','online')),
  status VARCHAR(20) CHECK (status IN ('pending','completed','failed','refunded')),
  stripe_payment_intent_id VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cash_register_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  shift_start TIMESTAMPTZ,
  shift_end TIMESTAMPTZ,
  opening_cash DECIMAL(10,2),
  total_cash DECIMAL(10,2),
  total_card DECIMAL(10,2),
  total_online DECIMAL(10,2),
  closing_cash DECIMAL(10,2),
  variance DECIMAL(10,2),
  notes TEXT
);
```

---

### 4️⃣ MODULO PULIZIA TAVOLI & STATUS

#### 🎯 Obiettivo

Tracciare il ciclo di vita del tavolo dopo ogni cliente per massimizzare il turnover.

#### ✨ Funzionalità

**Workflow Pulizia**

```
Pagamento completato
      ↓
Notifica push a cameriere: "Tavolo T003 libero — da pulire"
      ↓
Cameriere avvia pulizia (timestamp start)
      ↓
Checklist configurabile:
  ☐ Piatti rimossi
  ☐ Tovaglioli sostituiti
  ☐ Tavolo pulito
  ☐ Coperto ripristinato
      ↓
Cameriere conferma completamento
      ↓
Tavolo torna AVAILABLE
Il prossimo cliente riceverà un QR completamente nuovo
```

**Stato Tavoli (color-coded, real-time)**

| Colore | Stato | Significato |
|---|---|---|
| 🟢 Verde | `AVAILABLE` | Libero, pulito, pronto |
| 🟡 Giallo | `OCCUPIED` | Cliente presente |
| 🔴 Rosso | `CLEANING` | In attesa di pulizia |
| 🟠 Arancio | `RESERVED` | Prenotazione in arrivo |
| ⚫ Grigio | `MAINTENANCE` | Non disponibile |

---

### 5️⃣ MODULO PRENOTAZIONI

**Funzionalità**

- Prenotazione da locale (cameriere/proprietario)
- Widget embedded su sito del locale per prenotazioni online
- Calendario settimanale/mensile per il proprietario
- Reminder SMS automatici (24h prima, 1h prima) via Twilio
- Tracking no-show
- Assegnazione automatica tavolo in base a capacità e zona

#### 💾 Database Schema (Prenotazioni)

```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  customer_name VARCHAR(200),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(200),
  party_size INT,
  reservation_date DATE,
  reservation_time TIME,
  table_id UUID REFERENCES tables(id),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','arrived','completed','no_show','cancelled')),
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 6️⃣ MODULO ORDINI ONLINE (CASA/ASPORTO)

**Tipi di ordine**

- **Asporto**: cliente ordina da app o web, ritira in loco
- **Consegna**: indirizzo di consegna, gestito internamente (no integrazione rider esterna in fase 1)
- **Preorder tavolo**: cliente ordina da casa prima di arrivare

**Sicurezza**

- Prepagamento obbligatorio via Stripe
- OTP SMS (Twilio) per conferma ordine: 6 cifre, validità 5 minuti, max 3 tentativi

---

### 7️⃣ MODULO DASHBOARD PROPRIETARIO

Hub centrale per gestione e monitoring. Accessibile da browser (React) e da app Flutter.

**Sezioni**

| Sezione | Contenuto |
|---|---|
| **Home** | KPIs real-time: clienti presenti, occupazione tavoli, ordini in coda, incassi odierni |
| **Tavoli** | Mappa interattiva, stato colore-coded, azioni rapide (occupa, pulisci, disabilita) |
| **Ordini** | Lista filtrabile per stato/categoria/tipo, modifica, stampa ristampa |
| **Cassa** | Riconciliazione turni, incassi per metodo, storico transazioni |
| **Prenotazioni** | Calendario, no-show tracking, reminder bulk |
| **Staff** | Turni, assenze, produttività per cameriere |
| **Analytics** | Trend incassi, top seller, orari picco, tempo medio servizio |
| **Menu** | Gestione piatti, categorie, prezzi, disponibilità |
| **Configurazione** | Dati locale, tavoli, stampante, integrazioni, permessi team |

---

### 8️⃣ MODULO IA & AUTOMAZIONI *(Fase 2 — Opzionale)*

Da attivare come add-on per i locali che lo richiedono.

- **Virtual Waiter**: chatbot su menu (risponde a domande su allergeni, ingredienti, piatti del giorno)
- **Parsing note allergie**: rilevazione automatica allergie nelle note libere dell'ordine, alert in cucina
- **Suggerimenti abbinamento**: basati sullo storico ordini del locale
- **Sentiment analysis feedback**: analisi del testo di feedback post-pasto
- **Previsione inventario**: suggerimenti settimanali basati su storico vendite e stagionalità
- **Staffing predittivo**: raccomandazioni su numero camerieri per fascia oraria
- **Anomaly detection**: ordini anomali, tentativi OTP ripetuti, pattern sospetti

> **Scelta modello IA**: Da valutare in fase 2 tra Gemini 1.5 Flash (economico), GPT-4o mini o Claude claude-haiku-4-5-20251001. Architettura a plugin — il modulo IA è intercambiabile.

---

## 🖨️ Infrastruttura di Stampa (Pi Zero W)

Questa è la soluzione **più efficiente e meno costosa** per la stampa delle commesse in locale.

### Perché Pi Zero W

| Criterio | Pi Zero W | Tablet Android dedicato | PC locale |
|---|---|---|---|
| Costo hardware | ~15€ | ~80-150€ | ~200-400€ |
| Consumo energetico | ~0.5-1W | ~3-5W | ~50-100W |
| Manutenzione | Minima | Media | Alta |
| Affidabilità | Alta (headless, no UI) | Media | Media |
| Setup | 30 min | 1-2h | 2-4h |

### Architettura di Stampa

Il Pi Zero W agisce come **print bridge** tra il cloud e la stampante fisica:

```
VPS (Rust WebSocket Server)
        │
        │  WSS (canale dedicato per print_channel)
        ▼
Raspberry Pi Zero W (LAN locale)
  └── print_daemon.py
        │  USB
        ▼
  Stampante Termica ESC/POS
```

### Stampante Consigliata

**Qualsiasi stampante ESC/POS USB** va bene. Raccomandazioni per rapporto qualità/prezzo:

| Modello | Prezzo indicativo | Note |
|---|---|---|
| **Xprinter XP-58IIH** | ~30-40€ | Ottimo entry-level, 58mm |
| **Xprinter XP-80C** | ~50-70€ | 80mm, più leggibile |
| **HPRT TP808** | ~60-80€ | Affidabile, veloce |
| **Epson TM-T20III** | ~150-200€ | Premium, massima affidabilità |

> **Scelta consigliata per proposta ai locali**: Xprinter 80mm (~60€) + Pi Zero W (~15€) = ~75€ totali per stazione di stampa. Un locale può avere più Pi Zero W (uno per cucina, uno per bar, uno per cassa).

### Software Pi Zero W — print_daemon.py

```python
#!/usr/bin/env python3
"""
RestaurantFlow Print Daemon
Gira su Raspberry Pi Zero W
Si connette al WebSocket server su VPS e stampa le commesse in arrivo
"""

import asyncio
import websockets
import json
import usb.core
import usb.util
from escpos.printer import Usb

WEBSOCKET_URL = "wss://api.restaurantflow.dev/ws/print"
VENUE_ID = "YOUR_VENUE_ID"
PRINTER_VENDOR_ID = 0x0483   # da aggiornare con idVendor della stampante
PRINTER_PRODUCT_ID = 0x5743  # da aggiornare con idProduct della stampante

def print_order(order: dict):
    """Stampa una commessa sulla termica ESC/POS"""
    p = Usb(PRINTER_VENDOR_ID, PRINTER_PRODUCT_ID)
    p.set(align='center', bold=True, width=2, height=2)
    p.text(f"{order['station'].upper()}\n")
    p.set(align='left', bold=False, width=1, height=1)
    p.text("=" * 32 + "\n")
    p.set(bold=True)
    p.text(f"Tavolo: {order['table_label']}  ID: {order['order_id'][-6:]}\n")
    p.text(f"Ora: {order['created_at']}\n")
    p.text("-" * 32 + "\n")
    p.set(bold=False)
    for item in order['items']:
        qty = item['quantity']
        name = item['name']
        notes = f"  ↳ {item['notes']}" if item.get('notes') else ""
        p.text(f"  {qty}x {name}{notes}\n")
    p.text("=" * 32 + "\n")
    if order.get('priority') == 'rush':
        p.set(bold=True, align='center')
        p.text("*** RUSH ***\n")
    p.cut()

async def connect_and_listen():
    headers = {"X-Venue-Id": VENUE_ID, "X-Device-Type": "printer"}
    async with websockets.connect(WEBSOCKET_URL, extra_headers=headers) as ws:
        print("[INFO] Connesso al server. In ascolto per commesse...")
        async for message in ws:
            payload = json.loads(message)
            if payload.get("type") == "PRINT_ORDER":
                print(f"[PRINT] Stampa ordine {payload['order']['order_id']}")
                print_order(payload['order'])

if __name__ == "__main__":
    asyncio.run(connect_and_listen())
```

### Setup Pi Zero W — Step by Step

```bash
# 1. Flash Raspberry Pi OS Lite su SD card (via Raspberry Pi Imager)
# 2. Abilitare SSH e configurare Wi-Fi del locale tramite Imager
# 3. Prima connessione SSH
ssh pi@restaurantflow-printer.local

# 4. Aggiornamento sistema
sudo apt update && sudo apt upgrade -y

# 5. Installazione dipendenze
sudo apt install python3-pip python3-usb -y
pip3 install python-escpos websockets

# 6. Aggiungere regola udev per stampante USB senza sudo
echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", MODE="0666"' | \
  sudo tee /etc/udev/rules.d/99-printer.rules
sudo udevadm control --reload-rules

# 7. Installare il daemon come servizio systemd
sudo nano /etc/systemd/system/restaurantflow-printer.service
```

```ini
[Unit]
Description=RestaurantFlow Print Daemon
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/print_daemon.py
Restart=always
RestartSec=5
User=pi
WorkingDirectory=/home/pi

[Install]
WantedBy=multi-user.target
```

```bash
# 8. Abilitare e avviare il servizio
sudo systemctl enable restaurantflow-printer
sudo systemctl start restaurantflow-printer
sudo systemctl status restaurantflow-printer
```

### Canal WebSocket Print (lato Rust)

Il server Rust mantiene un canale dedicato `/ws/print` separato dal canale generale `/ws`:

- I client printer si autenticano con `X-Venue-Id` + token device generato dal pannello proprietario
- Quando Spring Boot emette un evento `ORDER_CREATED`, Rust forwarda il payload al client printer del venue corrispondente
- In caso di disconnessione del Pi Zero W, gli ordini vengono accodati su Redis e recapitati alla riconnessione (garanzia at-least-once)

---

## 🏷️ Etichette E-Ink per QR Dinamici (OpenEPaperLink)

### Perché OpenEPaperLink

OpenEPaperLink è un progetto open source che permette di usare etichette e-ink di seconda mano (dismesse da supermercati) con firmware custom, controllabili via HTTP. È la soluzione più economica disponibile per display e-ink wireless, senza abbonamenti né piattaforme proprietarie.

**Confronto con alternative enterprise:**

| | OpenEPaperLink | SOLUM/Hanshow enterprise |
|---|---|---|
| Costo per etichetta | ~2-5€ (seconda mano) | ~30-80€ (nuovo) |
| Costo access point | ~15-20€ (ESP32) | ~100-200€ (gateway) |
| Abbonamento software | ❌ Nessuno | ✅ SaaS mensile |
| API | HTTP semplice | REST documentata |
| Adatto a produzione | ✅ Sì | ✅ Sì |
| Supporto | Community open source | Vendor commerciale |

### Come funziona

```
Spring Boot (VPS)
      │
      │  HTTP POST con immagine PNG del QR
      │  (quando tavolo → OCCUPIED)
      ▼
Access Point ESP32-S3 (in-locale, alimentato a rete)
  firmware: OpenEPaperLink
      │
      │  Radio 802.15.4 (wireless, ~25-30m di range)
      ▼
Tag e-ink sul tavolo (a batteria CR2450, anni di autonomia)
  Display si aggiorna in ~2-3 secondi
  Poi rimane visibile senza consumare energia
```

### Alimentazione

| Componente | Alimentazione |
|---|---|
| **Tag e-ink (tavoli)** | Batterie CR2450 — durata **anni** con aggiornamenti occasionali. Il display e-ink consuma energia solo durante l'aggiornamento; a schermo statico non consuma nulla |
| **Access Point ESP32** | Alimentazione da rete (presa normale). Un solo dispositivo fisso per locale, posizionato in un punto centrale nascosto |

> Zero cavi ai tavoli. Le etichette si posizionano in un supporto da tavolo o nel portamenù senza alcuna connessione fisica.

### Hardware necessario

| Componente | Dove acquistare | Costo indicativo |
|---|---|---|
| Tag e-ink Solum 2.9" (usati) | eBay, AliExpress, lotti da supermercati dismessi | ~2-5€ l'uno |
| Tag e-ink Solum 4.2" (usati) | eBay | ~4-8€ l'uno |
| ESP32-S3 dev board (Access Point) | Amazon, AliExpress | ~15-20€ |
| Supporto da tavolo per etichetta | Stampato in 3D o acquistato | ~1-2€ |
| **Totale per 20 tavoli** | — | **~70-130€** |

> Un solo Access Point ESP32-S3 gestisce fino a diverse centinaia di tag con range di ~25-30 metri. Per locali grandi o su più piani, si aggiungono ulteriori AP (~15€ l'uno).

### Integrazione con Spring Boot

Quando il cameriere marca un tavolo come `OCCUPIED`, Spring Boot:

1. Genera la nuova QR session (UUID + JWT)
2. Renderizza il QR come immagine PNG (libreria ZXing o simile)
3. Fa un `HTTP POST` all'Access Point OpenEPaperLink con l'immagine e il MAC address del tag del tavolo

```java
// Esempio chiamata Spring Boot → OpenEPaperLink AP
@Service
public class EslService {

    @Value("${esl.ap.url}")  // es. http://192.168.1.50
    private String apUrl;

    public void updateTableQr(String tagMac, byte[] qrImagePng) {
        RestTemplate restTemplate = new RestTemplate();

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("mac", tagMac);
        body.add("image", new ByteArrayResource(qrImagePng) {
            @Override public String getFilename() { return "qr.png"; }
        });

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        restTemplate.postForEntity(
            apUrl + "/imgupload",
            new HttpEntity<>(body, headers),
            String.class
        );
    }
}
```

L'endpoint `/imgupload` dell'AP OpenEPaperLink accetta l'immagine e la trasmette via radio al tag identificato dal MAC address. Il tutto avviene in pochi secondi.

### Endpoint API OpenEPaperLink (AP locale)

```
POST  http://{ap-ip}/imgupload          — Invia immagine a un tag (multipart: mac + image)
GET   http://{ap-ip}/get_db             — Lista tag connessi con stato e batteria
GET   http://{ap-ip}/get_ap_config      — Configurazione access point
POST  http://{ap-ip}/set_ap_config      — Aggiorna configurazione
```

### Tabella MAC address tag (database)

Il MAC address di ogni tag va salvato nel database associato al tavolo:

```sql
ALTER TABLE tables
  ADD COLUMN esl_tag_mac VARCHAR(17),   -- es. "AA:BB:CC:DD:EE:FF"
  ADD COLUMN esl_ap_ip   VARCHAR(15);   -- es. "192.168.1.50"
```

### Fallback senza etichette e-ink

Per locali che non vogliono investire nell'hardware ESL, il sistema funziona identicamente con QR stampati su cartoncino plastificato nel portamenù. Il cameriere, dopo aver marcato il tavolo come occupato, stampa il nuovo QR dalla dashboard (o lo mostra sul tablet). Stessa logica server-side, zero hardware aggiuntivo.

---

### Requisiti VPS

- OS: Ubuntu 22.04 LTS
- RAM: minimo 2GB (4GB raccomandati)
- CPU: 2 vCPU
- Storage: 20GB SSD

```bash
# Stack VPS minimo raccomandato
# PostgreSQL 16
sudo apt install postgresql-16

# Redis 7
sudo apt install redis-server

# Java 21 (per Spring Boot)
sudo apt install openjdk-21-jdk

# Rust (per WebSocket server)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Variabili d'Ambiente (.env)

```env
# Database
DATABASE_URL=postgresql://restaurantflow:STRONG_PASS@localhost:5432/restaurantflow

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_256bit_secret_key_here
JWT_EXPIRY=24h

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Twilio (SMS/OTP)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+39xxxxxxxxxx

# App
SPRING_PORT=8080
RUST_WS_PORT=8081
FRONTEND_URL=https://app.restaurantflow.dev

# ESL OpenEPaperLink (indirizzo locale dell'Access Point ESP32 nel locale)
# Ogni venue può avere il proprio AP — gestito come configurazione per-venue nel DB
ESL_AP_DEFAULT_URL=http://192.168.1.50

# IA (fase 2 opzionale)
GEMINI_API_KEY=your_key
```

---

## 📅 Roadmap di Sviluppo

### Phase 1 — Core MVP (Mesi 1-3)

- ✅ Infrastruttura VPS (Spring Boot + Rust WS + PostgreSQL + Redis)
- ✅ Auth (JWT, ruoli: proprietario / cameriere / cucina)
- ✅ Gestione tavoli + QR code dinamici (rinnovo per occupazione)
- ✅ Menu digitale (PWA cliente, no app richiesta)
- ✅ Modulo ordini base (da QR e da cameriere)
- ✅ WebSocket real-time (stato tavoli, ordini, notifiche)
- ✅ Infrastruttura stampa Pi Zero W + stampante ESC/POS
- ✅ Stampa automatica commesse per stazione
- ✅ Dashboard proprietario base (tavoli, ordini, cassa)
- ✅ App Flutter cameriere (lista tavoli, ordini, stato)

### Phase 2 — Pagamenti & Prenotazioni (Mesi 4-5)

- 🔄 Integrazione Stripe (pagamenti da tavolo, contactless)
- 🔄 Modulo cassa e riconciliazione
- 🔄 Prenotazioni (locale + widget online)
- 🔄 Reminder SMS via Twilio
- 🔄 Ordini asporto

### Phase 3 — App & Delivery (Mesi 6-8)

- 📅 App Flutter cliente (ordini online, tracking)
- 📅 Modulo delivery (indirizzo, tracking stato)
- 📅 OTP SMS per ordini online
- 📅 Analytics avanzate dashboard

### Phase 4 — IA & Multi-locale (Mesi 9+)

- 📈 Modulo IA opzionale (virtual waiter, allergie, suggerimenti)
- 📈 Multi-venue (un account gestisce più locali)
- 📈 Loyalty program
- 📈 Gestione inventario
- 📈 Reportistica avanzata / export contabilità

---

## 📡 Documentazione API

### Authentication

```
Header: Authorization: Bearer {JWT_TOKEN}
Token scadenza: 24h
Refresh token: 7 giorni
```

### Endpoints Principali

#### Tavoli

```
GET    /api/v1/venues/{venue_id}/tables              — Lista tavoli
POST   /api/v1/venues/{venue_id}/tables              — Crea tavolo
PUT    /api/v1/tables/{id}/status                    — Aggiorna stato (occupa, libera, ecc.)
GET    /api/v1/tables/{id}/qr-session                — QR session attiva
POST   /api/v1/tables/{id}/qr-session/validate       — Valida token QR (chiamata da cliente)
POST   /api/v1/tables/{id}/qr-session/invalidate     — Invalida manuale (da proprietario)
```

#### Ordini

```
POST   /api/v1/orders                                — Crea ordine
GET    /api/v1/orders/{id}                           — Dettaglio ordine
PUT    /api/v1/orders/{id}                           — Modifica ordine
DELETE /api/v1/orders/{id}                           — Cancella ordine
PUT    /api/v1/orders/{id}/status                    — Aggiorna stato ordine
POST   /api/v1/orders/{id}/items                     — Aggiungi item
```

#### Pagamenti

```
POST   /api/v1/payments                              — Avvia pagamento
POST   /api/v1/payments/{id}/confirm                 — Conferma pagamento (Stripe webhook)
POST   /api/v1/payments/{id}/refund                  — Rimborso
GET    /api/v1/venues/{id}/cash-register/shift       — Riconciliazione turno
```

#### Prenotazioni

```
POST   /api/v1/reservations                          — Crea prenotazione
GET    /api/v1/venues/{id}/reservations              — Lista prenotazioni
PUT    /api/v1/reservations/{id}                     — Modifica
DELETE /api/v1/reservations/{id}                     — Cancella
PUT    /api/v1/reservations/{id}/status              — Aggiorna stato (arrived, no_show ecc.)
```

#### WebSocket Events (Rust server — porta 8081)

```
Connessione: wss://api.restaurantflow.dev/ws
Auth header: X-Venue-Id, Authorization: Bearer {token}

Events emessi dal server:
  TABLE_STATUS_CHANGED    { table_id, status }
  ORDER_CREATED           { order }
  ORDER_STATUS_CHANGED    { order_id, status }
  PRINT_ORDER             { order, station }     ← canale /ws/print (Pi Zero W)
  PAYMENT_COMPLETED       { order_id, table_id }
  RESERVATION_INCOMING    { reservation, eta_minutes }
```

---

## 🔐 Sicurezza

1. **JWT** — HS256, scadenza 24h, refresh token 7 giorni
2. **QR Code** — Token server-side a sessione unica; invalidazione immediata al cambio stato tavolo
3. **OTP** — 6 cifre, 5 minuti validità, max 3 tentativi, rate limiting
4. **API** — CORS configurato, rate limiting per IP, HTTPS/TLS 1.3 obbligatorio
5. **Database** — Parametrized queries (JPA), encryption at rest, backup automatici giornalieri
6. **Password** — bcrypt + salt
7. **Stripe** — Tokenizzazione carte, nessun dato carta salvato in-house
8. **Print Bridge** — Token device univoco per ogni Pi Zero W; revocabile dal pannello proprietario
9. **Logging** — Audit trail per operazioni sensibili (sconti, cancellazioni, accessi)

---

## 🎨 Design & UX

### Principi

- **Mobile-first**: il cliente usa lo smartphone; il cameriere usa un tablet
- **Zero friction per il cliente**: scan QR → menu → ordine in meno di 30 secondi
- **Real-time feedback**: ogni azione produce risposta visiva immediata (WebSocket)

### Theme Profiles

**Dark Mode (pub, locali notturni, bar)**

```css
--dark-bg: #1a1f3a;
--dark-surface: #2d3456;
--accent-gold: #d4a537;
--text-primary: #ffffff;
--text-secondary: #a8aac5;
```

**Light Mode (ristoranti, caffè, ambienti diurni)**

```css
--light-bg: #f5f3f0;
--light-surface: #ffffff;
--accent-green: #6b8e6f;
--text-primary: #2c3e50;
--text-secondary: #7f8c8d;
```

Il locale può scegliere il tema dalla dashboard. Il menu cliente eredita il tema del locale.

### Responsive

| Breakpoint | Target |
|---|---|
| 320px+ | Smartphone cliente (menu, ordini) |
| 768px+ | Tablet cameriere (app Flutter) |
| 1024px+ | Dashboard proprietario |
| 1440px+ | Kitchen Display System |

### Accessibilità (WCAG 2.1 AA)

- Contrasto minimo 4.5:1 su testo
- Focus states visibili
- ARIA labels
- Keyboard navigation completo

---

## 📚 Appendice

### A. Glossario

| Termine | Definizione |
|---|---|
| **QR Session** | Sessione server-side associata a un tavolo occupato; genera il QR valido |
| **Venue** | Singolo ristorante/locale |
| **Station** | Area cucina dedicata a categoria (pizzeria, bar, pasticceria, ecc.) |
| **Print Bridge** | Pi Zero W che fa da ponte tra VPS e stampante fisica |
| **ESC/POS** | Protocollo standard per stampanti termiche |
| **KDS** | Kitchen Display System — schermo in cucina che mostra gli ordini |
| **ESL** | Electronic Shelf Label — etichetta e-ink wireless per visualizzare il QR al tavolo |
| **OpenEPaperLink** | Firmware open source per etichette e-ink Solum di seconda mano |
| **Access Point ESL** | ESP32-S3 con firmware OpenEPaperLink; riceve immagini via HTTP e le trasmette via radio ai tag |
| **Tag MAC** | Indirizzo hardware univoco di ogni etichetta e-ink; usato per identificare quale tag aggiornare |
| **Dine-in** | Ordine servito al tavolo |
| **Takeaway** | Ordine ritirato dal cliente |
| **OTP** | One-Time Password via SMS |

### B. Integrazioni Third-party

| Servizio | Scopo |
|---|---|
| **Stripe** | Pagamenti online e da tavolo |
| **Twilio** | SMS (OTP, reminder prenotazioni) |
| **OpenEPaperLink** | Firmware open source per etichette e-ink; espone HTTP API per push immagini |
| **ZXing** | Libreria Java per generazione QR code come immagine PNG |
| **python-escpos** | Libreria Python per ESC/POS su Pi Zero W |
| **python-websockets** | Client WebSocket asincrono su Pi Zero W |
| **tokio / axum** | Runtime asincrono Rust per WebSocket server |
| **Spring Security** | Auth e gestione ruoli |
| **Hibernate / JPA** | ORM per PostgreSQL |

### C. Hardware Necessario per Locale

**Stazione di stampa (cucina/bar/cassa):**

| Componente | Costo Indicativo | Note |
|---|---|---|
| Raspberry Pi Zero W | ~15€ | 1 per stazione di stampa |
| MicroSD card 8GB | ~5€ | Per OS |
| Adattatore USB OTG | ~3€ | Pi Zero W ha micro-USB |
| Stampante termica ESC/POS 80mm | ~50-80€ | Xprinter consigliato |
| **Totale per stazione stampa** | **~75-105€** | — |

Un locale tipico ha 2-3 stazioni (cucina + bar + cassa). Costo stimato: **150-315€**.

**Etichette e-ink per tavoli (OpenEPaperLink):**

| Componente | Costo Indicativo | Note |
|---|---|---|
| ESP32-S3 (Access Point ESL) | ~15-20€ | 1 solo per tutto il locale |
| Tag e-ink Solum 2.9" usati | ~2-5€ l'uno | eBay / AliExpress, lotti da supermercati |
| Tag e-ink Solum 4.2" usati | ~4-8€ l'uno | Più leggibili da distanza |
| Batterie CR2450 (incluse nei tag usati) | — | Durata anni con aggiornamenti occasionali |
| Supporto da tavolo | ~1-2€ | Stampabile in 3D o acquistabile |
| **Totale per 20 tavoli (tag 2.9")** | **~115-140€** | AP + 20 tag + supporti |

> **Nessun cavo ai tavoli.** L'unico dispositivo che richiede alimentazione elettrica è l'Access Point ESP32 (una sola presa in tutto il locale).

---

**Versione**: 2.1.0  
**Ultimo aggiornamento**: Maggio 2025  
**Preparato per**: Centro di Sviluppo

---

*RestaurantFlow — Operatività senza attrito, per ogni locale.* 🍽️

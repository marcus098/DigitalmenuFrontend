# Deploy RestaurantFlow su Ubuntu

End-to-end: dalla VPS appena comprata al servizio HTTPS in produzione.
Tempo: ~45 minuti la prima volta.

---

## 0. Cosa ti serve prima di iniziare

| Cosa | Dove |
|---|---|
| VPS Ubuntu 22.04 o 24.04 LTS | Hetzner CX22 (€4/mese, sede UE) / DigitalOcean / Scaleway |
| Dominio | Tuo registrar (Aruba, Cloudflare Registrar, Namecheap) |
| Account Backblaze B2 | b2.backblazeb2.com — bucket per immagini + bucket per backup |
| Account Stripe | dashboard.stripe.com — chiavi live |
| Account Sentry (opzionale) | sentry.io — progetto React |
| Chiave SSH pubblica | `cat ~/.ssh/id_ed25519.pub` (se non ce l'hai: `ssh-keygen -t ed25519`) |

Specifiche minime VPS: **2 vCPU / 4 GB RAM / 40 GB SSD**.
Sotto i 4 GB Postgres+Mongo+Kafka+JVM x2 vanno in swap e tutto rallenta.

---

## 1. DNS

Crea i record **A** puntati all'IP della VPS:

```
app.tuodominio.it       → IP_VPS
api.tuodominio.it       → IP_VPS
reactive.tuodominio.it  → IP_VPS
ws.tuodominio.it        → IP_VPS    (opzionale, per il futuro Rust WS)
```

Aspetta che `dig app.tuodominio.it` risponda con l'IP prima di proseguire.
La propagazione DNS è necessaria perché Caddy possa ottenere i certificati
Let's Encrypt al primo avvio.

---

## 2. Bootstrap della VPS

SSH come root al primo accesso, poi:

```bash
# Scarica e lancia lo script di bootstrap.
# Crea utente 'deploy', installa Docker + Caddy + UFW + fail2ban, hardenizza SSH.
export DEPLOY_USER=deploy
export DEPLOY_SSH_KEY="ssh-ed25519 AAAA... tua-chiave-pubblica"

curl -fsSL https://raw.githubusercontent.com/marcus098/DigitalmenuFrontend/master/deploy/bootstrap-ubuntu.sh \
  | bash
```

Lo script è **idempotente**: se qualcosa va storto, rilancialo senza paura.

Verifica subito che puoi entrare come `deploy` da un'altra finestra (non
chiudere quella di root finché non hai confermato):

```bash
ssh deploy@IP_VPS
```

Solo dopo, chiudi la sessione root.

---

## 3. Clona repo e configura

Come utente `deploy`:

```bash
cd ~
git clone https://github.com/marcus098/DigitalmenuFrontend.git
git clone https://github.com/marcus098/DigitalmenuBackend.git
cd DigitalmenuFrontend

cp .env.compose.example .env
nano .env
```

Da compilare in `.env`:

| Variabile | Esempio |
|---|---|
| `FRONTEND_URL` | `https://app.tuodominio.it` |
| `BACKEND_URL` | `https://api.tuodominio.it` |
| `WEBFLUX_URL` | `https://reactive.tuodominio.it` |
| `WS_URL` | `wss://ws.tuodominio.it` |
| `POSTGRES_PASSWORD` | password forte: `openssl rand -base64 24` |
| `BUCKET_S3_*` | credenziali Backblaze del bucket immagini |
| `STRIPE_SECRET_KEY` | `sk_live_...` da Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` da Stripe (Webhooks → Add endpoint) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` da Stripe |
| `BACKUP_S3_BUCKET` | bucket B2 **separato** per backup (con write-only key) |
| `BACKUP_PASSPHRASE` | opzionale ma consigliato: `openssl rand -base64 32` |
| `SENTRY_DSN` | opzionale, dal progetto Sentry |
| `BIND_ADDR` | lascia `127.0.0.1` (default — Caddy fa da ingresso unico) |

Permessi restrittivi per evitare letture accidentali:
```bash
chmod 600 .env
```

---

## 4. Configura Caddy (reverse proxy + TLS)

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Sostituisci ovunque:
- `example.com` → il tuo dominio reale (4 occorrenze: app/api/reactive/ws)
- `admin@example.com` → tua email per notifiche Let's Encrypt

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo journalctl -u caddy -f   # ctrl-c quando vedi "certificate obtained"
```

I certificati arrivano da Let's Encrypt al primo hit HTTPS. La prima volta
Caddy fa una validazione HTTP-01 sulla porta 80 (già aperta dall'UFW).

---

## 5. Avvia lo stack

```bash
# Login a GitHub Container Registry per pullare immagine pre-buildata.
# Crea un Personal Access Token con scope read:packages su github.com/settings/tokens
echo "GHCR_TOKEN" | docker login ghcr.io -u TUO_GITHUB_USER --password-stdin

# Prima volta: build locale (backend e webflux Java richiedono mvn nei loro Dockerfile)
docker compose build
docker compose up -d

# Stato (tutti i container dovrebbero essere up + healthy)
docker compose ps
docker compose logs -f --tail=50 frontend backend
```

Sanity check da host:
```bash
curl -I http://127.0.0.1:3000/healthz       # nginx → 200
curl -I http://127.0.0.1:8085/actuator/health  # backend, se esposto
```

E da fuori, attraverso Caddy:
```bash
curl -I https://app.tuodominio.it/healthz
```

Se vedi `HTTP/2 200`, è online.

---

## 6. Configura il webhook Stripe

Dashboard Stripe → Developers → Webhooks → Add endpoint:
- URL: `https://api.tuodominio.it/api/stripe/webhook` (verifica il path nel backend)
- Eventi: `checkout.session.completed`, `payment_intent.succeeded`, `invoice.paid`, `customer.subscription.*`

Copia il **Signing secret** che inizia con `whsec_` in `.env` come
`STRIPE_WEBHOOK_SECRET` e riavvia il backend:
```bash
docker compose up -d backend
```

---

## 7. Backup automatici

Il servizio `postgres-backup` definito in `docker-compose.yml` esegue
`pg_dump` ogni notte (`SCHEDULE=@daily`) e carica su B2 con rotazione a 30
giorni. Verifica:

```bash
docker compose logs postgres-backup
```

Test manuale (forza un backup adesso):
```bash
docker compose exec postgres-backup sh -c '/backup.sh'
```

Controlla nel bucket B2 sotto `BACKUP_S3_PREFIX/` che il dump sia arrivato.

### Restore di un dump

```bash
# 1. Scarica dump dal bucket B2 (con aws-cli o B2 CLI)
aws s3 cp s3://BACKUP_BUCKET/postgres-backups/2026-06-22T03-00-00.dump.gz . \
  --endpoint-url https://s3.eu-central-003.backblazeb2.com

# 2. (Se cifrato con BACKUP_PASSPHRASE)
gpg --decrypt --batch --passphrase "$BACKUP_PASSPHRASE" \
  2026-06-22T03-00-00.dump.gz.gpg > dump.gz

# 3. Ferma il backend (per evitare scritture concorrenti)
docker compose stop backend webflux

# 4. Restore
gunzip -c dump.gz | docker compose exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# 5. Riparti
docker compose start backend webflux
```

### Mongo backup

**Non ancora automatizzato.** Workaround manuale:
```bash
docker compose exec mongodb mongodump --archive --gzip > mongo-$(date +%F).gz
# Carica su B2 a mano o con rclone
```
TODO: aggiungere container dedicato (issue #X).

---

## 8. Aggiornamenti

Il workflow GitHub Actions `release.yml` pubblica l'immagine frontend su
GHCR al push di un tag. Per aggiornare sul server:

```bash
cd ~/DigitalmenuFrontend
git pull
docker compose pull
docker compose up -d
docker image prune -f
```

Per il backend (build locale): `git pull && docker compose build backend webflux && docker compose up -d`.

Rollback istantaneo se qualcosa rompe:
```bash
docker compose pull frontend:vPRECEDENTE
docker compose up -d
```

---

## 9. Monitoring

| Cosa | Dove |
|---|---|
| Errori frontend | Sentry (sentry.io) — arrivano in tempo reale |
| Uptime | Workflow GitHub Actions `uptime.yml` ogni 5 min — apre issue su failure |
| Container logs | `docker compose logs -f` (rotated 50 MB × 5 file dal `daemon.json`) |
| Caddy access log | `/var/log/caddy/{app,api}.log` (JSON, rotated 50 MB × 7) |
| Risorse VPS | `htop`, `docker stats` |

Per un dashboard tipo Grafana o alert su Telegram, considera **Uptime Kuma**
self-hosted (`docker run -d --restart=unless-stopped -p 127.0.0.1:3001:3001 louislam/uptime-kuma:1`)
proxato da Caddy con una sottodomain `status.tuodominio.it`.

---

## 10. Sicurezza ricorrente

| Quando | Cosa |
|---|---|
| Settimanale | `sudo apt update && sudo apt upgrade` (anche se `unattended-upgrades` lo fa) |
| Mensile | Audit Dependabot PR aperte sul repo, mergi quelle non-major |
| Trimestrale | Rotazione `POSTGRES_PASSWORD`, ricreazione `JWT_SECRET` |
| Annuale | Rotazione chiavi B2 / Stripe restricted keys |
| Continuo | Monitorare alert Sentry, controllare Caddy logs per pattern di attacco |

---

## 11. Risoluzione problemi

### Caddy non ottiene il certificato
- Verifica DNS: `dig app.tuodominio.it` deve restituire l'IP della VPS
- Verifica firewall: `sudo ufw status` deve mostrare 80/tcp ALLOW
- Verifica log: `journalctl -u caddy -n 100`

### Container `unhealthy` o crash loop
```bash
docker compose ps
docker compose logs --tail=200 NOMESERVICE
```
Tipicamente: variabili d'ambiente mancanti, DB non raggiungibile, OOM (la VPS è troppo piccola).

### "Bind: address already in use" su porta 80/443
Caddy si è installato come servizio systemd ma c'è anche un nginx residuo o
il container frontend prova a bindarsi a 0.0.0.0. Verifica `BIND_ADDR=127.0.0.1`
in `.env`, e: `sudo lsof -i :443`.

### Stripe webhook 400 — Bad signature
`STRIPE_WEBHOOK_SECRET` è quello dell'endpoint sbagliato (test invece di live, o uno vecchio). Rigenera nel dashboard Stripe e aggiorna `.env`.

### Backup non parte
`docker compose logs postgres-backup` — di solito sono credenziali B2
mancanti o bucket inesistente. Le credenziali write-only sono consigliate
ma se non funzionano usa temporaneamente le stesse di `BUCKET_S3_*`.

---

## 12. Costo a regime

| Voce | Costo mensile |
|---|---|
| Hetzner CX22 (2 vCPU / 4 GB / 40 GB) | €4.51 |
| Dominio .it | ~€0.85 (€10/anno) |
| Backblaze B2 storage (~5 GB foto + backup) | €0.05 |
| Backblaze B2 download | €0.01/GB (free fino a 3× storage) |
| Stripe | 1.5% + €0.25 per transazione EU |
| Sentry free | €0 (fino a 5k errori/mese) |
| **Totale infra fissa** | **~€5.50/mese** |

Scalabilità: 50-100 ristoranti reggono comodi su questa VPS. Oltre, è il
momento di separare Postgres su un managed service (Hetzner Cloud DBaaS o
Supabase) e mettere il backend dietro a un load balancer.

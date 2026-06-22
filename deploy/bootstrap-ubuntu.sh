#!/usr/bin/env bash
# RestaurantFlow — Ubuntu 22.04/24.04 server bootstrap.
# Idempotent: safe to re-run after partial failure.
#
# Run as root on a fresh server:
#   curl -fsSL https://raw.githubusercontent.com/marcus098/DigitalmenuFrontend/master/deploy/bootstrap-ubuntu.sh | bash
# Or after cloning:
#   sudo bash deploy/bootstrap-ubuntu.sh
#
# Configure these BEFORE running (or export them):
#   DEPLOY_USER=deploy         # non-root user to create
#   DEPLOY_SSH_KEY=""          # paste your ssh public key here OR leave empty to skip
#   CADDY_ADMIN_EMAIL=""       # set in /etc/caddy/Caddyfile manually

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-}"

log()  { printf '\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }

[ "$EUID" -eq 0 ] || { echo "Run as root."; exit 1; }

# ─── 1. System update ───────────────────────────────────────────────────────
log "Updating apt packages"
DEBIAN_FRONTEND=noninteractive apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    ca-certificates curl gnupg ufw fail2ban unattended-upgrades git htop
ok "System up to date"

# ─── 2. Non-root user ───────────────────────────────────────────────────────
if id "$DEPLOY_USER" >/dev/null 2>&1; then
    ok "User '$DEPLOY_USER' already exists"
else
    log "Creating user '$DEPLOY_USER'"
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    ok "User created"
fi

if [ -n "$DEPLOY_SSH_KEY" ]; then
    log "Installing SSH key for $DEPLOY_USER"
    install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
    echo "$DEPLOY_SSH_KEY" > "/home/$DEPLOY_USER/.ssh/authorized_keys"
    chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
    chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
    ok "SSH key installed"
fi

# ─── 3. SSH hardening ───────────────────────────────────────────────────────
log "Hardening sshd"
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd
ok "sshd hardened (root login disabled, password auth disabled)"

# ─── 4. Firewall ────────────────────────────────────────────────────────────
log "Configuring UFW"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ok "UFW active (22, 80, 443)"

# ─── 5. fail2ban for sshd ───────────────────────────────────────────────────
systemctl enable --now fail2ban
ok "fail2ban enabled"

# ─── 6. Automatic security updates ──────────────────────────────────────────
log "Enabling unattended-upgrades"
echo 'APT::Periodic::Update-Package-Lists "1";' > /etc/apt/apt.conf.d/20auto-upgrades
echo 'APT::Periodic::Unattended-Upgrade "1";'   >> /etc/apt/apt.conf.d/20auto-upgrades
ok "Security updates will install automatically"

# ─── 7. Docker Engine + compose plugin ──────────────────────────────────────
if command -v docker >/dev/null 2>&1; then
    ok "Docker already installed"
else
    log "Installing Docker Engine"
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    . /etc/os-release
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
        https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ok "Docker installed"
fi
usermod -aG docker "$DEPLOY_USER"

# Log rotation for containers
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "5" },
  "live-restore": true
}
EOF
systemctl restart docker
ok "Docker log rotation configured"

# ─── 8. Caddy (reverse proxy + TLS) ─────────────────────────────────────────
if command -v caddy >/dev/null 2>&1; then
    ok "Caddy already installed"
else
    log "Installing Caddy"
    apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
        | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
        > /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
    apt-get install -y -qq caddy
    ok "Caddy installed"
fi
mkdir -p /var/log/caddy
chown -R caddy:caddy /var/log/caddy
systemctl enable caddy
ok "Caddy enabled"

# ─── Summary ────────────────────────────────────────────────────────────────
cat <<EOF

────────────────────────────────────────────────────────────────────
✓ Bootstrap complete.

Next steps (as user '$DEPLOY_USER'):

  su - $DEPLOY_USER
  cd ~
  git clone https://github.com/marcus098/DigitalmenuFrontend.git
  git clone https://github.com/marcus098/DigitalmenuBackend.git
  cd DigitalmenuFrontend
  cp .env.compose.example .env
  nano .env                              # fill in real values
  sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
  sudo nano /etc/caddy/Caddyfile         # replace example.com with real domain
  sudo systemctl reload caddy
  docker login ghcr.io                   # if pulling private images
  docker compose up -d
  docker compose ps

See deploy.md for the full procedure including DNS, backups, updates.
────────────────────────────────────────────────────────────────────
EOF

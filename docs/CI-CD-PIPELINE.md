# CI/CD Pipeline: Vom GitHub Push zur Live-Website

## Übersicht

```
GitHub Repo                    GitHub Actions                Server (test)
───────────────────────────────────────────────────────────────────────────

   Push auf main ─────────▶ Workflow startet
                            │
                            ├─ Code auschecken
                            ├─ Docker Image bauen
                            ├─ Image → GHCR pushen
                            │
                            └─ Webhook aufrufen ────────────▶ Webhook empfängt
                                                             │
                                                             ├─ docker compose pull
                                                             ├─ docker compose up -d
                                                             │
                                                             └─ Container läuft ✓
                                                                     │
                                                                     ▼
                                                             Traefik routet
                                                             vocabuai.fryy.de
```

---

## 1. GitHub Actions Workflows (`.github/workflows/*.yml`)

Diese Dateien definieren, was bei einem Push passieren soll. GitHub führt sie automatisch aus.

**`deploy.yml`** (Backend):
```yaml
on:
  push:
    branches: [main]    # Trigger: Push auf main

jobs:
  deploy:
    runs-on: ubuntu-latest    # GitHub stellt eine VM bereit
    steps:
      - uses: actions/checkout@v4              # Code holen
      - uses: docker/login-action@v3           # Bei GHCR einloggen
      - uses: docker/build-push-action@v6      # Image bauen + pushen
      - run: curl -X POST ... deploy-hook      # Server benachrichtigen
```

**Was passiert:**
1. GitHub startet eine temporäre VM
2. Dein Code wird ausgecheckt
3. `docker build` mit deinem Dockerfile
4. Image wird zu `ghcr.io/cmauersberger/vocabuai:latest` gepusht
5. Webhook wird aufgerufen → Server weiß: "Neues Image verfügbar"

---

## 2. Docker Images (GHCR)

GitHub Container Registry speichert deine gebauten Images:

- `ghcr.io/cmauersberger/vocabuai:latest` (Backend)
- `ghcr.io/cmauersberger/vocabuai-frontend:latest` (Frontend)

Der Server pullt von dort. Du baust nie lokal für Production.

---

## 3. Webhook Service (auf dem Server)

Ein kleiner HTTP-Server, der auf Deployment-Requests wartet.

**URL:** `https://deploy-hook.fryy.de/hooks/deploy-vocabuai`

**Was er macht bei Aufruf:**
```bash
cd /opt/docker-setups-test/vocabuai
docker compose pull      # Neuestes Image von GHCR holen
docker compose up -d     # Container neu starten
docker image prune -f    # Alte Images aufräumen
```

**Sicherheit:** Header `X-Deploy-Token` muss stimmen (in GitHub Secrets hinterlegt).

---

## 4. Docker Compose (auf dem Server)

`/opt/docker-setups-test/vocabuai/compose.yaml` definiert, welche Container laufen:

```yaml
services:
  frontend:
    image: ghcr.io/cmauersberger/vocabuai-frontend:latest
    labels:
      - "traefik...rule=Host(`vocabuai.fryy.de`)"
      - "traefik...priority=1"              # Fallback für alles

  backend:
    image: ghcr.io/cmauersberger/vocabuai:latest
    labels:
      - "traefik...rule=Host(`vocabuai.fryy.de`) && PathPrefix(`/api`)"
      - "traefik...priority=10"             # /api hat Vorrang

  db:
    image: postgres:17-alpine
    volumes:
      - db_data:/var/lib/postgresql/data   # Persistente Daten
```

---

## 5. Traefik (Reverse Proxy)

Läuft als zentraler Eintrittspunkt auf dem Server. Aufgaben:

- **HTTPS-Terminierung:** Holt automatisch Let's Encrypt Zertifikate via Cloudflare DNS
- **Routing:** Leitet Requests an die richtigen Container weiter
- **Service Discovery:** Liest `labels` aus Docker und konfiguriert sich selbst

```
Internet ──▶ Cloudflare ──▶ Traefik (:443) ──▶ Container
                                │
                                ├─ /api/* → backend:5080
                                └─ /*     → frontend:80
```

---

## Was muss auf dem Server laufen?

| Service | Funktion | Pfad |
|---------|----------|------|
| **Traefik** | Reverse Proxy, HTTPS | `/opt/docker-setups-test/traefik/` |
| **Webhook** | Empfängt Deploy-Trigger | `/opt/docker-setups-test/webhook/` |
| **Docker** | Container Runtime | Systemdienst |

---

## GitHub Secrets & Variables

Im Repo unter Settings → Secrets and variables → Actions:

| Name | Typ | Zweck |
|------|-----|-------|
| `GITHUB_TOKEN` | Auto | GHCR Login (automatisch vorhanden) |
| `DEPLOY_TOKEN` | Secret | Webhook-Authentifizierung |
| `DEPLOY_WEBHOOK_URL` | Variable | `https://deploy-hook.fryy.de/hooks/deploy-vocabuai` |

---

## Zusammengefasst

1. **Du pushst** → GitHub Actions baut Image → pushed zu GHCR → ruft Webhook
2. **Server empfängt** → pullt neues Image → startet Container neu
3. **Traefik routet** → HTTPS + Path-Routing → User sieht neue Version

Keine manuellen Deployments. Kein SSH auf den Server nötig. Push = Deploy.

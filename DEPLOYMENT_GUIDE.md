# 🚀 Guía de Despliegue — AcademyOS

## Índice
1. [Resumen del Stack Tecnológico](#1-resumen-del-stack-tecnológico)
2. [Requisitos Previos Comunes](#2-requisitos-previos-comunes)
3. [Opción A: VPS Hetzner (Recomendado)](#3-opción-a-vps-hetzner)
4. [Opción B: Hostinger VPS](#4-opción-b-hostinger-vps)
5. [Opción C: Railway (PaaS)](#5-opción-c-railway-paas)
6. [Opción D: DigitalOcean App Platform](#6-opción-d-digitalocean-app-platform)
7. [Configuración de Dominio y SSL](#7-configuración-de-dominio-y-ssl)
8. [Variables de Entorno en Producción](#8-variables-de-entorno-en-producción)
9. [Mantenimiento y Backups](#9-mantenimiento-y-backups)
10. [Comparativa de Costes](#10-comparativa-de-costes)

---

## 1. Resumen del Stack Tecnológico

| Componente | Tecnología | Versión |
|---|---|---|
| Frontend | React 18 + TailwindCSS 3.4 | Node 18+ |
| Backend | FastAPI + Uvicorn | Python 3.11+ |
| Base de datos | MongoDB | 6.0+ |
| IA | OpenAI GPT-5.2 (via Emergent LLM Key) | - |
| WebSockets | FastAPI nativo | - |

### Estructura del proyecto
```
academy-saas/
├── backend/
│   ├── server.py          # API principal (~2700 líneas)
│   ├── requirements.txt   # Dependencias Python
│   └── .env               # Variables de entorno backend
├── frontend/
│   ├── src/               # Código React
│   ├── package.json       # Dependencias Node
│   ├── tailwind.config.js
│   └── .env               # Variables de entorno frontend
└── memory/                # Documentación
```

### Puertos
- **Frontend**: 3000 (desarrollo) → build estático en producción
- **Backend**: 8001
- **MongoDB**: 27017

---

## 2. Requisitos Previos Comunes

### 2.1 Variables de entorno necesarias

**Backend (`backend/.env`):**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=academy_saas
EMERGENT_LLM_KEY=tu-clave-emergent-llm
JWT_SECRET=una-clave-secreta-larga-y-segura-generada-aleatoriamente
```

**Frontend (`frontend/.env`):**
```env
REACT_APP_BACKEND_URL=https://tu-dominio.com
```

> ⚠️ **Importante:** `REACT_APP_BACKEND_URL` debe apuntar a la URL pública donde el backend será accesible (con el prefijo `/api`).

### 2.2 Generar JWT_SECRET seguro
```bash
openssl rand -hex 64
```

### 2.3 Obtener la Emergent LLM Key
1. Ve a [emergentagent.com](https://emergentagent.com)
2. Perfil → Universal Key → Copiar clave
3. Añadir balance si es necesario

---

## 3. Opción A: VPS Hetzner

**Coste:** ~€4.5/mes (CX22: 2 vCPU, 4GB RAM, 40GB SSD)
**Ideal para:** Producción real, control total, mejor relación precio/rendimiento en Europa.

### Paso 1: Crear el servidor

1. Accede a [console.hetzner.cloud](https://console.hetzner.cloud)
2. Crea un nuevo proyecto → **Add Server**
3. Selecciona:
   - **Ubicación:** Falkenstein (DE) o Helsinki (FI)
   - **Imagen:** Ubuntu 22.04 LTS
   - **Tipo:** CX22 (2 vCPU, 4GB RAM) — mínimo recomendado
   - **SSH Key:** Añade tu clave pública SSH
4. Click **Create & Buy Now**

### Paso 2: Conectar y preparar el servidor

```bash
# Conectar al servidor
ssh root@TU_IP_HETZNER

# Actualizar sistema
apt update && apt upgrade -y

# Crear usuario de aplicación (no usar root en producción)
adduser academy
usermod -aG sudo academy
su - academy
```

### Paso 3: Instalar dependencias del sistema

```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# MongoDB 6.0
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Nginx (reverse proxy)
sudo apt install -y nginx

# Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Git
sudo apt install -y git
```

### Paso 4: Clonar y configurar el proyecto

```bash
cd /home/academy
git clone https://github.com/TU_USUARIO/academy-saas.git
cd academy-saas
```

#### Backend
```bash
cd backend

# Crear entorno virtual
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Crear archivo .env
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=academy_saas
EMERGENT_LLM_KEY=tu-clave-emergent-aqui
EOF

# Verificar que funciona
python -c "from server import app; print('Backend OK')"
deactivate
cd ..
```

#### Frontend
```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env
echo "REACT_APP_BACKEND_URL=https://tu-dominio.com" > .env

# Build de producción
npm run build

cd ..
```

### Paso 5: Configurar servicios con Systemd

#### Backend Service
```bash
sudo tee /etc/systemd/system/academy-backend.service << 'EOF'
[Unit]
Description=AcademyOS Backend API
After=network.target mongod.service

[Service]
Type=simple
User=academy
WorkingDirectory=/home/academy/academy-saas/backend
Environment=PATH=/home/academy/academy-saas/backend/venv/bin:/usr/bin
ExecStart=/home/academy/academy-saas/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable academy-backend
sudo systemctl start academy-backend
```

#### Verificar que el backend responde
```bash
curl http://localhost:8001/api/health
# Debe responder: {"status":"ok","service":"Academy SaaS API"}
```

### Paso 6: Configurar Nginx como Reverse Proxy

```bash
sudo tee /etc/nginx/sites-available/academy << 'EOF'
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Frontend (build estático)
    root /home/academy/academy-saas/frontend/build;
    index index.html;

    # API y WebSocket → Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;

        # Upload size (para subida de archivos)
        client_max_body_size 50M;
    }

    # Frontend SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Activar el sitio
sudo ln -sf /etc/nginx/sites-available/academy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 7: SSL con Let's Encrypt

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
# Sigue las instrucciones, acepta los términos
# Certbot configurará la renovación automática
```

### Paso 8: Seed de datos iniciales

```bash
cd /home/academy/academy-saas/backend
source venv/bin/activate
# Accede a la app en el navegador y crea una cuenta
# O ejecuta el seed desde la API si existe
```

### Paso 9: Verificación final

```bash
# Backend
curl https://tu-dominio.com/api/health

# Frontend
curl -s https://tu-dominio.com | head -5

# MongoDB
mongosh --eval "db.stats()"

# Logs
sudo journalctl -u academy-backend -f
```

---

## 4. Opción B: Hostinger VPS

**Coste:** ~€5.99/mes (KVM 1: 1 vCPU, 4GB RAM, 50GB SSD)
**Ideal para:** Usuarios que ya tienen hosting con Hostinger, panel de gestión amigable.

### Paso 1: Contratar el VPS

1. Ve a [hostinger.com/vps-hosting](https://www.hostinger.com/vps-hosting)
2. Selecciona el plan **KVM 1** o superior
3. Elige sistema operativo: **Ubuntu 22.04**
4. En el panel de Hostinger, obtén la **IP** y credenciales de acceso

### Paso 2: Acceso y configuración inicial

```bash
# Conectar (usa la contraseña del panel o configura SSH key)
ssh root@TU_IP_HOSTINGER

# Configurar firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable

# Crear usuario
adduser academy
usermod -aG sudo academy
```

### Paso 3: Instalar dependencias

> Los pasos son idénticos a Hetzner (Paso 3). Ejecuta los mismos comandos para instalar Node.js 18, Python 3.11, MongoDB 6.0, Nginx y Certbot.

### Paso 4: Clonar y configurar

> Sigue los mismos pasos que Hetzner (Pasos 4-8).

### Paso 5: Configurar dominio en Hostinger

1. En el **panel de Hostinger** → DNS Zone
2. Añade un registro **A** apuntando a la IP del VPS:
   - Tipo: `A`
   - Nombre: `@`
   - Valor: `TU_IP_VPS`
   - TTL: 14400
3. Repite para `www`:
   - Tipo: `CNAME`
   - Nombre: `www`
   - Valor: `tu-dominio.com`

### Paso 6: SSL y verificación

```bash
# SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar
curl https://tu-dominio.com/api/health
```

### Diferencias con Hetzner
| Aspecto | Hostinger | Hetzner |
|---|---|---|
| Panel de gestión | hPanel (más visual) | Cloud Console (técnico) |
| Soporte | 24/7 chat en español | Tickets, documentación |
| Data centers | Europa, Asia, USA | Europa (DE, FI) |
| Snapshots | Incluidos gratis | De pago (€0.01/GB/mes) |
| Red privada | No en plan básico | VLAN incluida |

---

## 5. Opción C: Railway (PaaS)

**Coste:** ~$5-20/mes (pago por uso) | Hobby plan $5/mes
**Ideal para:** Despliegue rápido sin gestionar servidores. Perfecto para demos y MVPs.

### Paso 1: Crear cuenta y proyecto

1. Ve a [railway.app](https://railway.app) y crea una cuenta
2. Click **New Project** → **Deploy from GitHub repo**
3. Conecta tu repositorio de GitHub

### Paso 2: Configurar MongoDB

1. En el proyecto de Railway, click **+ New** → **Database** → **MongoDB**
2. Railway creará una instancia de MongoDB automáticamente
3. Copia la variable `MONGO_URL` que Railway genera (ej: `mongodb://mongo:xxxxxx@...`)

### Paso 3: Configurar el Backend

1. Click **+ New** → **GitHub Repo** → Selecciona tu repo
2. En **Settings**:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt && pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
3. En **Variables**, añade:
   ```
   MONGO_URL=<la URL de MongoDB de Railway>
   DB_NAME=academy_saas
   EMERGENT_LLM_KEY=tu-clave-emergent
   PORT=8001
   ```
4. Railway generará una URL pública (ej: `academy-backend.up.railway.app`)

### Paso 4: Configurar el Frontend

1. Click **+ New** → **GitHub Repo** → Selecciona tu repo
2. En **Settings**:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -l $PORT`
3. En **Variables**, añade:
   ```
   REACT_APP_BACKEND_URL=https://academy-backend.up.railway.app
   ```
4. Instala `serve` en package.json o usa el comando directamente

### Paso 5: Dominio personalizado (opcional)

1. En el servicio del frontend → **Settings** → **Domains**
2. Click **+ Custom Domain** → Introduce `tu-dominio.com`
3. Railway te dará un registro CNAME para configurar en tu DNS
4. SSL se configura automáticamente

### Estructura en Railway
```
Proyecto Railway
├── MongoDB (database)
├── Backend (servicio) → academy-backend.up.railway.app
└── Frontend (servicio) → tu-dominio.com
```

### Archivo `railway.toml` (opcional, en raíz del repo)
```toml
[build]
builder = "nixpacks"

[deploy]
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

---

## 6. Opción D: DigitalOcean App Platform

**Coste:** ~$12/mes (Basic plan: 1 container backend + static frontend + MongoDB)
**Ideal para:** PaaS con más control que Railway, buena documentación, escalable.

### Paso 1: Crear cuenta y App

1. Ve a [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Click **Create** → **Apps**
3. Conecta tu repositorio de GitHub

### Paso 2: Configurar MongoDB

**Opción A: Managed Database de DigitalOcean**
1. **Create** → **Databases** → **MongoDB**
2. Selecciona plan ($15/mes el básico — 1GB RAM, 10GB storage)
3. Copia la **Connection String**

**Opción B: MongoDB Atlas (gratis hasta 512MB)**
1. Ve a [cloud.mongodb.com](https://cloud.mongodb.com)
2. Crea un cluster **M0 Free** (AWS / GCP)
3. Crea un usuario de base de datos
4. Whitelist IP: `0.0.0.0/0` (para permitir acceso desde DO)
5. Copia la Connection String:
   ```
   mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/academy_saas
   ```

### Paso 3: Configurar la App en App Platform

1. Al crear la App, añade **dos componentes**:

#### Componente 1: Backend (Web Service)
- **Source:** Tu repo, directorio `backend/`
- **Environment:** Python
- **Build Command:** `pip install -r requirements.txt && pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/`
- **Run Command:** `uvicorn server:app --host 0.0.0.0 --port 8080`
- **HTTP Port:** 8080
- **HTTP Route:** `/api`
- **Variables de entorno:**
  ```
  MONGO_URL=mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/academy_saas
  DB_NAME=academy_saas
  EMERGENT_LLM_KEY=tu-clave-emergent
  ```

#### Componente 2: Frontend (Static Site)
- **Source:** Tu repo, directorio `frontend/`
- **Build Command:** `npm install && npm run build`
- **Output Directory:** `build`
- **HTTP Route:** `/`
- **Variables de entorno (build time):**
  ```
  REACT_APP_BACKEND_URL=https://tu-app.ondigitalocean.app
  ```
- **Catchall Document:** `index.html` (para SPA routing)

### Paso 4: Configurar enrutamiento

En **App Settings** → **Routing Rules**:
- `/api/*` → Backend service
- `/*` → Frontend static site

### Paso 5: Dominio personalizado

1. En App Settings → **Domains**
2. Click **Add Domain** → Introduce `tu-dominio.com`
3. Añade el registro CNAME en tu DNS
4. SSL automático incluido

### Paso 6: Verificar

```bash
curl https://tu-app.ondigitalocean.app/api/health
```

---

## 7. Configuración de Dominio y SSL

### Proveedores de dominio recomendados
- **Namecheap:** ~$9/año para `.com`
- **Cloudflare Registrar:** al coste (sin margen)
- **Porkbun:** económico, buen panel

### Registros DNS necesarios

| Tipo | Nombre | Valor | TTL |
|---|---|---|---|
| A | @ | IP_DEL_SERVIDOR | 3600 |
| CNAME | www | tu-dominio.com | 3600 |

### SSL con Let's Encrypt (para VPS)
```bash
# Instalar
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática (ya configurada, verificar)
sudo certbot renew --dry-run

# Cron de renovación (se añade automáticamente)
# 0 12 * * * /usr/bin/certbot renew --quiet
```

> En Railway y DigitalOcean App Platform, el SSL es automático.

---

## 8. Variables de Entorno en Producción

### Backend (`.env` o variables del hosting)
```env
MONGO_URL=mongodb://usuario:password@host:27017/academy_saas
DB_NAME=academy_saas
EMERGENT_LLM_KEY=sk-emergent-xxxxx
```

### Frontend (solo en tiempo de build)
```env
REACT_APP_BACKEND_URL=https://tu-dominio.com
```

### Notas de seguridad
- **Nunca** subas archivos `.env` al repositorio
- Añade `.env` a `.gitignore`
- En PaaS (Railway/DO), usa las variables de entorno del panel
- Genera `JWT_SECRET` con `openssl rand -hex 64`
- Rota las claves periódicamente

---

## 9. Mantenimiento y Backups

### Backup de MongoDB (VPS)

```bash
# Backup manual
mongodump --db academy_saas --out /home/academy/backups/$(date +%Y%m%d)

# Backup automático diario (crontab)
crontab -e
# Añadir:
0 3 * * * mongodump --db academy_saas --out /home/academy/backups/$(date +\%Y\%m\%d) && find /home/academy/backups -mtime +30 -delete
```

### Restaurar backup
```bash
mongorestore --db academy_saas /home/academy/backups/20260701/academy_saas/
```

### Actualizar la aplicación (VPS)

```bash
cd /home/academy/academy-saas

# Obtener cambios
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart academy-backend

# Frontend
cd ../frontend
npm install
npm run build
# Nginx sirve el build estático, no requiere reinicio
```

### Monitoreo (VPS)

```bash
# Logs del backend
sudo journalctl -u academy-backend -f

# Estado de servicios
sudo systemctl status academy-backend mongod nginx

# Uso de disco/memoria
df -h && free -h
```

---

## 10. Comparativa de Costes

| Característica | Hetzner CX22 | Hostinger KVM 1 | Railway | DO App Platform |
|---|---|---|---|---|
| **Coste mensual** | ~€4.50 | ~€5.99 | ~$5-20 | ~$12-27 |
| **vCPU / RAM** | 2 / 4GB | 1 / 4GB | Compartido | Compartido |
| **Storage** | 40GB SSD | 50GB SSD | Según uso | Según uso |
| **MongoDB incluido** | Self-managed | Self-managed | Add-on $0 | Atlas free / $15 |
| **SSL** | Certbot (gratis) | Certbot (gratis) | Automático | Automático |
| **Gestión servidor** | Manual (SSH) | Manual (SSH) | No necesaria | No necesaria |
| **Escalabilidad** | Manual | Manual | Automática | Automática |
| **Dominio personalizado** | Sí | Sí | Sí | Sí |
| **Tiempo de setup** | 45-60 min | 45-60 min | 15-20 min | 20-30 min |
| **Ideal para** | Producción | Producción | MVP/Demo | Producción |

### Recomendación

| Escenario | Mejor opción |
|---|---|
| **Arrancar rápido (demo/MVP)** | Railway |
| **Producción con presupuesto ajustado** | Hetzner CX22 |
| **Ya tienes hosting Hostinger** | Hostinger VPS |
| **Producción escalable sin sysadmin** | DigitalOcean App Platform |
| **Máximo control y rendimiento** | Hetzner CX22 + MongoDB Atlas |

---

## Checklist de Despliegue

- [ ] Dominio comprado y DNS configurado
- [ ] Repositorio en GitHub con código actualizado
- [ ] Variables de entorno configuradas (MONGO_URL, DB_NAME, EMERGENT_LLM_KEY)
- [ ] MongoDB accesible y funcionando
- [ ] Backend responde en `/api/health`
- [ ] Frontend build generado y servido
- [ ] SSL/HTTPS activado
- [ ] WebSockets funcionando (notificaciones en tiempo real)
- [ ] Backup de MongoDB configurado
- [ ] Seed de datos ejecutado (crear cuenta de admin)
- [ ] Probado login, dashboard, y funcionalidades principales

---

*Documento generado para AcademyOS v1.0 — Julio 2026*

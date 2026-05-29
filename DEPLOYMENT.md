# AcademyOS - Guía de Despliegue Multi-Plataforma

## Índice

1. [Arquitectura de la Aplicación](#1-arquitectura-de-la-aplicación)
2. [Requisitos del Sistema](#2-requisitos-del-sistema)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Base de Datos MongoDB](#5-base-de-datos-mongodb)
6. [Dependencias](#6-dependencias)
7. [Despliegue con Docker](#7-despliegue-con-docker)
8. [Despliegue en Railway](#8-despliegue-en-railway)
9. [Despliegue en Render](#9-despliegue-en-render)
10. [Despliegue en AWS (EC2 + DocumentDB)](#10-despliegue-en-aws)
11. [Despliegue en Google Cloud (Cloud Run)](#11-despliegue-en-google-cloud)
12. [Despliegue en Azure (App Service)](#12-despliegue-en-azure)
13. [Despliegue en DigitalOcean (App Platform)](#13-despliegue-en-digitalocean)
14. [Despliegue en VPS Genérico](#14-despliegue-en-vps-genérico)
15. [Configuración de Dominio y SSL](#15-configuración-de-dominio-y-ssl)
16. [Monitoreo y Logs](#16-monitoreo-y-logs)
17. [Seguridad en Producción](#17-seguridad-en-producción)
18. [Escalabilidad](#18-escalabilidad)
19. [Backup y Recuperación](#19-backup-y-recuperación)
20. [Checklist Pre-Despliegue](#20-checklist-pre-despliegue)

---

## 1. Arquitectura de la Aplicación

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                      │
│                                                           │
│  React SPA (puerto 3000 dev / archivos estáticos prod)   │
│  - TailwindCSS, Recharts, FullCalendar, Framer Motion    │
│  - i18n: 7 idiomas (EN, ES, DE, FR, PT, IT, AR + RTL)   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS /api/*
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                        │
│                                                           │
│  Python 3.11+ / Uvicorn (puerto 8001)                    │
│  - JWT Authentication (HS256)                             │
│  - Multi-tenant (club_id en todas las colecciones)       │
│  - Motor (driver async MongoDB)                           │
│  - 50+ endpoints REST                                     │
└──────────────┬──────────────────┬───────────────────────┘
               │                  │
               ▼                  ▼
┌──────────────────┐  ┌──────────────────────────┐
│   MongoDB 7.0+   │  │  Emergent Object Storage │
│                   │  │  (almacenamiento archivos)│
│  16 colecciones   │  │  - Fotos de jugadores     │
│  academy_saas DB  │  │  - Logos de clubes         │
└──────────────────┘  └──────────────────────────┘
```

### Flujo de Red en Producción

```
Internet → Nginx/CDN → Frontend (archivos estáticos)
                     → /api/* → Backend FastAPI (:8001)
                              → MongoDB (:27017)
                              → Emergent Storage (HTTPS externo)
```

---

## 2. Requisitos del Sistema

### Mínimos (desarrollo / demo)
| Recurso       | Valor        |
|---------------|--------------|
| CPU           | 1 vCPU       |
| RAM           | 1 GB         |
| Disco         | 5 GB         |
| Sistema       | Linux (Ubuntu 22.04+) |

### Recomendados (producción)
| Recurso       | Valor        |
|---------------|--------------|
| CPU           | 2 vCPUs      |
| RAM           | 4 GB         |
| Disco         | 20 GB SSD    |
| Sistema       | Linux (Ubuntu 22.04+) |

### Versiones de Software
| Software      | Versión Mínima | Versión Probada |
|---------------|----------------|-----------------|
| Python        | 3.10           | 3.11.15         |
| Node.js       | 18.x           | 20.20.2         |
| MongoDB       | 6.0            | 7.0.31          |
| npm/yarn      | yarn 1.22+     | yarn 1.22+      |

---

## 3. Variables de Entorno

### Backend (`/backend/.env`)

```env
# REQUERIDO: URL de conexión a MongoDB
MONGO_URL=mongodb://localhost:27017
# Para MongoDB Atlas:
# MONGO_URL=mongodb+srv://usuario:contraseña@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority

# REQUERIDO: Nombre de la base de datos
DB_NAME=academy_saas

# REQUERIDO: Clave secreta para firmar tokens JWT (cambiar en producción)
JWT_SECRET=tu_clave_secreta_muy_segura_aqui_min_32_chars

# OPCIONAL: Algoritmo JWT (por defecto HS256)
JWT_ALGORITHM=HS256

# OPCIONAL: Horas de expiración del token (por defecto 24)
JWT_EXPIRATION_HOURS=24

# REQUERIDO para subir archivos: Clave de Emergent
EMERGENT_LLM_KEY=sk-emergent-xxxxx
```

### Frontend (`/frontend/.env`)

```env
# REQUERIDO: URL pública del backend (SIN barra final)
REACT_APP_BACKEND_URL=https://tu-dominio.com
```

> **IMPORTANTE**: `REACT_APP_BACKEND_URL` se inyecta en build-time en React. Si cambias esta variable, debes reconstruir el frontend.

---

## 4. Estructura del Proyecto

```
academyos/
├── backend/
│   ├── .env                    # Variables de entorno (NO commitear)
│   ├── requirements.txt        # Dependencias Python (104 paquetes)
│   ├── server.py               # Aplicación FastAPI completa (~1500 líneas)
│   └── tests/                  # Tests unitarios
│       ├── test_seasons.py
│       ├── test_leaderboard.py
│       └── ...
├── frontend/
│   ├── .env                    # Variable REACT_APP_BACKEND_URL
│   ├── package.json            # Dependencias Node.js (28 paquetes)
│   ├── yarn.lock               # Lock file de dependencias
│   ├── tailwind.config.js      # Configuración TailwindCSS
│   ├── postcss.config.js       # Configuración PostCSS
│   ├── public/
│   │   ├── index.html          # HTML base
│   │   ├── icon.svg            # Icono de la aplicación
│   │   └── favicon.svg         # Favicon
│   └── src/
│       ├── App.js              # Router principal (23 rutas)
│       ├── api.js              # Cliente HTTP (GET/POST/PUT/DELETE/upload)
│       ├── index.js            # Entry point React
│       ├── index.css           # Estilos globales + RTL
│       ├── App.css             # Estilos de componentes
│       ├── components/
│       │   └── Layout.js       # Shell principal (sidebar + nav)
│       ├── contexts/
│       │   └── AuthContext.js   # Estado de autenticación global
│       ├── i18n/
│       │   ├── index.js        # Configuración i18next + RTL
│       │   └── locales/        # 7 archivos de traducción
│       │       ├── en.json, es.json, de.json
│       │       ├── fr.json, pt.json, it.json, ar.json
│       └── pages/              # 20+ componentes de página
│           ├── Dashboard.js, Players.js, Teams.js
│           ├── Training.js, Matches.js, Calendar.js
│           ├── Scouting.js, Reports.js, Seasons.js
│           ├── SeasonDetail.js, Notifications.js
│           ├── Announcements.js, ParentPortal.js
│           ├── Admin.js, Settings.js, PlayerProfile.js
│           ├── Landing.js, Login.js, Signup.js
│           └── ...
└── memory/
    └── PRD.md                  # Documento de requisitos
```

---

## 5. Base de Datos MongoDB

### Colecciones (16 total)

| Colección              | Descripción                          | Índices Recomendados           |
|------------------------|--------------------------------------|--------------------------------|
| `clubs`                | Datos del club/academia              | `_id`                          |
| `users`                | Usuarios (admin, coach, parent)      | `email` (unique), `club_id`    |
| `players`              | Jugadores                            | `club_id`, `team_id`, `status` |
| `teams`                | Equipos por categoría                | `club_id`                      |
| `training_sessions`    | Sesiones de entrenamiento            | `club_id`, `date`              |
| `training_attendance`  | Asistencia a entrenamientos          | `session_id`, `player_id`      |
| `matches`              | Partidos                             | `club_id`, `date`, `status`    |
| `match_player_stats`   | Estadísticas por jugador/partido     | `match_id`, `player_id`        |
| `calendar_events`      | Eventos del calendario               | `club_id`, `date`              |
| `player_evaluations`   | Evaluaciones de scouting             | `club_id`, `player_id`         |
| `player_metrics`       | Métricas de rendimiento              | `player_id`                    |
| `player_injuries`      | Historial médico/lesiones            | `player_id`, `status`          |
| `announcements`        | Comunicaciones/anuncios              | `club_id`, `created_at`        |
| `notifications`        | Notificaciones (mock email)          | `club_id`, `created_at`        |
| `seasons`              | Temporadas                           | `club_id`, `status`            |
| `files`                | Metadatos de archivos subidos        | `file_id`, `club_id`           |

### Crear Índices (ejecutar en mongosh)
```javascript
use academy_saas;
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ club_id: 1 });
db.players.createIndex({ club_id: 1, status: 1 });
db.players.createIndex({ team_id: 1 });
db.matches.createIndex({ club_id: 1, date: 1 });
db.training_sessions.createIndex({ club_id: 1, date: 1 });
db.match_player_stats.createIndex({ match_id: 1 });
db.training_attendance.createIndex({ session_id: 1 });
db.notifications.createIndex({ club_id: 1, created_at: -1 });
db.seasons.createIndex({ club_id: 1, status: 1 });
```

### Datos de Demostración
Después del despliegue, ejecutar una petición POST a `/api/seed` para poblar la base de datos con datos de ejemplo:
```bash
curl -X POST https://tu-dominio.com/api/seed
```
Esto crea: 1 club, 6 usuarios, 4 equipos, 60 jugadores, 10 entrenamientos, 6 partidos, 15 evaluaciones, 5 anuncios, 3 temporadas.

**Credenciales de demo:**
| Rol     | Email                   | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@academy.com       | admin123    |
| Coach   | carlos@academy.com      | coach123    |
| Parent  | parent@academy.com      | parent123   |

---

## 6. Dependencias

### Backend (Python) - Paquetes Principales
| Paquete           | Versión  | Propósito                      |
|-------------------|----------|--------------------------------|
| fastapi           | 0.110.1  | Framework web                  |
| uvicorn           | 0.25.0   | Servidor ASGI                  |
| motor             | 3.3.1    | Driver async MongoDB           |
| pymongo           | 4.5.0    | Driver MongoDB (base)          |
| pydantic          | 2.12.5   | Validación de datos            |
| PyJWT             | 2.11.0   | Tokens JWT                     |
| python-jose       | 3.5.0    | Operaciones JOSE/JWT           |
| passlib           | 1.7.4    | Hash de contraseñas            |
| bcrypt            | 4.1.3    | Algoritmo de hash              |
| python-dotenv     | 1.2.1    | Carga de .env                  |
| python-multipart  | 0.0.22   | Subida de archivos             |
| requests          | 2.32.5   | HTTP client (object storage)   |
| emergentintegrations | 0.1.0 | SDK Emergent (storage)         |

### Frontend (Node.js) - Paquetes Principales
| Paquete                 | Versión    | Propósito                    |
|-------------------------|------------|------------------------------|
| react                   | ^18.2.0    | UI framework                 |
| react-dom               | ^18.2.0    | Renderizado DOM              |
| react-router-dom        | ^6.22.0    | Enrutamiento SPA             |
| react-scripts           | 5.0.1      | Build toolchain (CRA)        |
| tailwindcss             | ^3.4.1     | CSS utility-first            |
| recharts                | ^2.12.0    | Gráficas                     |
| @fullcalendar/*         | ^6.1.11    | Calendario                   |
| framer-motion           | ^11.0.0    | Animaciones                  |
| lucide-react            | ^0.344.0   | Iconos                       |
| i18next                 | ^25.8.14   | Internacionalización         |
| react-i18next           | ^16.5.6    | Bindings React i18n          |
| i18next-browser-languagedetector | ^8.2.1 | Detección idioma      |
| jspdf / jspdf-autotable | ^4.2.0    | Exportar PDF                 |
| papaparse               | ^5.5.3     | Parsear/exportar CSV         |
| sonner                  | ^1.4.0     | Toasts/notificaciones        |

---

## 7. Despliegue con Docker

### Dockerfile Backend

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

COPY server.py .
COPY .env .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Dockerfile Frontend

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Servir con Nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf (para el frontend)

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA: redirigir todo al index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend
    location /api/ {
        proxy_pass http://backend:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: academyos-db
    restart: unless-stopped
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    environment:
      # Para producción, habilitar autenticación:
      # MONGO_INITDB_ROOT_USERNAME: admin
      # MONGO_INITDB_ROOT_PASSWORD: contraseña_segura
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: academyos-api
    restart: unless-stopped
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      MONGO_URL: mongodb://mongodb:27017
      DB_NAME: academy_saas
      JWT_SECRET: ${JWT_SECRET:-cambiar_en_produccion_min_32_chars}
      JWT_ALGORITHM: HS256
      JWT_EXPIRATION_HOURS: 24
      EMERGENT_LLM_KEY: ${EMERGENT_LLM_KEY}
    ports:
      - "8001:8001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/api/health"]
      interval: 15s
      timeout: 5s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        REACT_APP_BACKEND_URL: ${REACT_APP_BACKEND_URL:-http://localhost}
    container_name: academyos-web
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"
      - "443:443"

volumes:
  mongo_data:
    driver: local
```

### Comandos Docker

```bash
# Construir y levantar
docker-compose up -d --build

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Ejecutar seed
docker-compose exec backend curl -X POST http://localhost:8001/api/seed

# Parar todo
docker-compose down

# Parar y eliminar datos
docker-compose down -v
```

---

## 8. Despliegue en Railway

### Estructura
Railway permite desplegar servicios múltiples desde un monorepo.

### Pasos

1. **Crear proyecto en Railway** → Conectar repositorio Git

2. **Servicio MongoDB**:
   - Agregar servicio → Database → MongoDB
   - Railway provee automáticamente `MONGO_URL`

3. **Servicio Backend**:
   - Agregar servicio → GitHub Repo
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Variables:
     ```
     MONGO_URL=${{MongoDB.MONGO_URL}}/academy_saas
     DB_NAME=academy_saas
     JWT_SECRET=<generar-con-openssl-rand-hex-32>
     EMERGENT_LLM_KEY=sk-emergent-xxxxx
     ```

4. **Servicio Frontend**:
   - Agregar servicio → GitHub Repo
   - Root Directory: `frontend`
   - Build Command: `yarn install && yarn build`
   - Start Command: `npx serve -s build -l $PORT`
   - Variables:
     ```
     REACT_APP_BACKEND_URL=https://<tu-backend>.railway.app
     ```

5. **Networking**: Habilitar dominio público para frontend y backend

---

## 9. Despliegue en Render

### Backend (Web Service)
1. New → Web Service → Conectar repo
2. Configuración:
   - Root Directory: `backend`
   - Runtime: Python 3
   - Build: `pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/`
   - Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`
3. Variables de entorno: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `EMERGENT_LLM_KEY`

### Frontend (Static Site)
1. New → Static Site → Conectar repo
2. Configuración:
   - Root Directory: `frontend`
   - Build: `yarn install && yarn build`
   - Publish Directory: `build`
3. Agregar rewrite rule: `/* → /index.html` (status 200) para SPA routing
4. Variable: `REACT_APP_BACKEND_URL=https://<backend>.onrender.com`

### Base de datos
- Usar **MongoDB Atlas** (gratis tier M0) ya que Render no ofrece MongoDB nativo.

---

## 10. Despliegue en AWS

### Opción A: EC2 + DocumentDB

```bash
# 1. Lanzar EC2 (Ubuntu 22.04, t3.small mínimo)
# 2. Instalar dependencias
sudo apt update && sudo apt install -y python3.11 python3.11-venv nodejs npm nginx certbot
npm install -g yarn

# 3. Clonar repositorio
git clone <repo> /opt/academyos
cd /opt/academyos

# 4. Setup Backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
# Configurar .env con DocumentDB URL

# 5. Setup Frontend
cd ../frontend
yarn install
REACT_APP_BACKEND_URL=https://tu-dominio.com yarn build

# 6. Configurar systemd para backend
sudo tee /etc/systemd/system/academyos-api.service << 'EOF'
[Unit]
Description=AcademyOS API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/academyos/backend
Environment=PATH=/opt/academyos/backend/venv/bin
EnvironmentFile=/opt/academyos/backend/.env
ExecStart=/opt/academyos/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable academyos-api
sudo systemctl start academyos-api

# 7. Configurar Nginx
sudo tee /etc/nginx/sites-available/academyos << 'EOF'
server {
    listen 80;
    server_name tu-dominio.com;

    root /opt/academyos/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/academyos /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 8. SSL con Certbot
sudo certbot --nginx -d tu-dominio.com
```

### Opción B: ECS (Fargate) + DocumentDB
- Usar los Dockerfiles definidos en la sección 7
- DocumentDB como servicio MongoDB administrado
- ALB (Application Load Balancer) al frente

### Servicios AWS Necesarios
| Servicio       | Propósito                    | Costo Estimado   |
|----------------|------------------------------|------------------|
| EC2 t3.small   | Servidor app                 | ~$15/mes         |
| DocumentDB     | Base de datos (o Atlas Free) | $0-$200/mes      |
| Route 53       | DNS                          | $0.50/mes        |
| ACM            | Certificado SSL              | Gratis           |
| S3 (opcional)  | Backups                      | ~$1/mes          |

---

## 11. Despliegue en Google Cloud

### Cloud Run (Recomendado - Serverless)

```bash
# 1. Construir imágenes
gcloud builds submit --tag gcr.io/PROJECT_ID/academyos-api ./backend
gcloud builds submit --tag gcr.io/PROJECT_ID/academyos-web ./frontend

# 2. Desplegar backend
gcloud run deploy academyos-api \
  --image gcr.io/PROJECT_ID/academyos-api \
  --platform managed \
  --region us-central1 \
  --port 8001 \
  --set-env-vars "MONGO_URL=mongodb+srv://...,DB_NAME=academy_saas,JWT_SECRET=...,EMERGENT_LLM_KEY=..." \
  --allow-unauthenticated \
  --min-instances 1

# 3. Desplegar frontend
gcloud run deploy academyos-web \
  --image gcr.io/PROJECT_ID/academyos-web \
  --platform managed \
  --region us-central1 \
  --port 80 \
  --allow-unauthenticated
```

### Base de Datos
- **MongoDB Atlas** (recomendado) o **Firestore** si se adapta el código

---

## 12. Despliegue en Azure

### Azure App Service

```bash
# Backend
az webapp create --resource-group AcademyOS --plan AppPlan \
  --name academyos-api --runtime "PYTHON:3.11"
az webapp config appsettings set --name academyos-api \
  --settings MONGO_URL="..." DB_NAME="academy_saas" JWT_SECRET="..."
az webapp deployment source config --name academyos-api \
  --repo-url <git-repo> --branch main --manual-integration

# Frontend (Static Web Apps)
az staticwebapp create --name academyos-web \
  --resource-group AcademyOS \
  --source <git-repo> --branch main \
  --app-location "frontend" --output-location "build"
```

### Base de Datos
- **Azure Cosmos DB para MongoDB** (API compatible con MongoDB)

---

## 13. Despliegue en DigitalOcean

### App Platform

1. Crear App → Conectar repositorio
2. Configurar componentes:

**Backend (Web Service)**:
- Source: `/backend`
- Run: `uvicorn server:app --host 0.0.0.0 --port 8080`
- Build: `pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/`

**Frontend (Static Site)**:
- Source: `/frontend`
- Build: `yarn install && yarn build`
- Output: `build`

**Database**:
- Usar MongoDB Atlas (DigitalOcean ofrece PostgreSQL nativo, no MongoDB)

### Droplet (VPS)
- Seguir las instrucciones de la sección 14 (VPS Genérico)

---

## 14. Despliegue en VPS Genérico

Para cualquier VPS (Hetzner, Linode, OVH, Vultr, etc.):

```bash
# === INSTALACIÓN ===

# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar MongoDB 7.0
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable mongod && sudo systemctl start mongod

# 3. Instalar Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# 4. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g yarn

# 5. Instalar Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# === DESPLIEGUE ===

# 6. Clonar código
sudo mkdir -p /opt/academyos
cd /opt/academyos
git clone <tu-repositorio> .

# 7. Backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Configurar .env
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=academy_saas
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
EMERGENT_LLM_KEY=sk-emergent-tu-clave
EOF

# 8. Frontend
cd ../frontend
cat > .env << EOF
REACT_APP_BACKEND_URL=https://tu-dominio.com
EOF
yarn install
yarn build

# 9. Systemd service (backend)
sudo tee /etc/systemd/system/academyos.service << 'EOF'
[Unit]
Description=AcademyOS Backend
After=network.target mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/academyos/backend
Environment=PATH=/opt/academyos/backend/venv/bin
EnvironmentFile=/opt/academyos/backend/.env
ExecStart=/opt/academyos/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable academyos
sudo systemctl start academyos

# 10. Nginx config
sudo tee /etc/nginx/sites-available/academyos << 'NGINX'
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Frontend
    root /opt/academyos/frontend/build;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Cache para assets estáticos
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        client_max_body_size 10M;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/academyos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 11. SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com --non-interactive --agree-tos -m tu@email.com

# 12. Seed de datos
curl -X POST http://localhost:8001/api/seed
```

---

## 15. Configuración de Dominio y SSL

### DNS (cualquier proveedor)
```
Tipo    Nombre    Valor                  TTL
A       @         IP_DEL_SERVIDOR        300
A       www       IP_DEL_SERVIDOR        300
CNAME   api       tu-dominio.com         300
```

### SSL con Let's Encrypt (Certbot)
```bash
# Instalación
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática (ya configurada por certbot)
sudo certbot renew --dry-run
```

### SSL con Cloudflare
1. Apuntar nameservers del dominio a Cloudflare
2. Modo SSL: "Full (Strict)"
3. Cloudflare gestiona el certificado automáticamente

---

## 16. Monitoreo y Logs

### Logs del Backend
```bash
# Systemd
sudo journalctl -u academyos -f

# Docker
docker-compose logs -f backend
```

### Health Check
```bash
# Endpoint de salud
curl https://tu-dominio.com/api/health
# Respuesta esperada: {"status": "ok"}
```

### Monitoreo Recomendado
| Herramienta      | Propósito           | Gratis |
|------------------|---------------------|--------|
| UptimeRobot      | Monitoreo uptime    | Sí     |
| Better Stack     | Logs + alertas      | Sí     |
| MongoDB Atlas    | Métricas DB         | Sí     |
| Sentry           | Error tracking      | Sí     |

### Cron de Mantenimiento
```bash
# Agregar a crontab
sudo crontab -e

# Renovar SSL cada día
0 3 * * * certbot renew --quiet

# Backup MongoDB diario
0 2 * * * mongodump --db academy_saas --out /backups/mongo/$(date +\%Y\%m\%d)

# Limpiar backups antiguos (mantener 30 días)
0 4 * * * find /backups/mongo -mtime +30 -delete
```

---

## 17. Seguridad en Producción

### Checklist de Seguridad

- [ ] **JWT_SECRET**: Generar con `openssl rand -hex 32` (mínimo 32 caracteres)
- [ ] **CORS**: Cambiar de `*` a dominios específicos en `server.py`:
  ```python
  origins = ["https://tu-dominio.com", "https://www.tu-dominio.com"]
  ```
- [ ] **MongoDB**: Habilitar autenticación:
  ```bash
  # En mongod.conf
  security:
    authorization: enabled
  ```
- [ ] **Rate Limiting**: Agregar `slowapi` o usar Nginx:
  ```nginx
  limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
  location /api/ {
      limit_req zone=api burst=10 nodelay;
      ...
  }
  ```
- [ ] **Headers de seguridad** (en Nginx):
  ```nginx
  add_header X-Frame-Options "SAMEORIGIN";
  add_header X-Content-Type-Options "nosniff";
  add_header X-XSS-Protection "1; mode=block";
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
  ```
- [ ] **Firewall**: Solo permitir puertos 22, 80, 443:
  ```bash
  sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443
  sudo ufw enable
  ```
- [ ] **SSH**: Deshabilitar login con password, usar solo llaves SSH
- [ ] **Variables**: Nunca commitear archivos `.env`

---

## 18. Escalabilidad

### Horizontal (múltiples instancias)

```
                    ┌──────────────┐
                    │  Load Balancer│
                    │  (Nginx/ALB)  │
                    └──┬───┬───┬───┘
                       │   │   │
              ┌────────┘   │   └────────┐
              ▼            ▼            ▼
         ┌────────┐   ┌────────┐   ┌────────┐
         │API #1  │   │API #2  │   │API #3  │
         │:8001   │   │:8001   │   │:8001   │
         └───┬────┘   └───┬────┘   └───┬────┘
             └─────────┬───┘────────────┘
                       ▼
              ┌──────────────────┐
              │  MongoDB Replica  │
              │  Set / Atlas      │
              └──────────────────┘
```

### Uvicorn Workers
```bash
# Múltiples workers en un solo servidor
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

### MongoDB Atlas (escalable)
- **M0** (gratis): 512 MB, ideal para demo
- **M10** ($57/mes): 2 GB RAM, backups automáticos
- **M30** ($540/mes): 8 GB RAM, analytics, sharding

---

## 19. Backup y Recuperación

### Backup Manual
```bash
# Exportar toda la base de datos
mongodump --db academy_saas --out /backups/$(date +%Y%m%d)

# Exportar una colección específica
mongodump --db academy_saas --collection players --out /backups/players_$(date +%Y%m%d)
```

### Restaurar
```bash
# Restaurar base de datos completa
mongorestore --db academy_saas /backups/20260308/academy_saas/

# Restaurar una colección
mongorestore --db academy_saas --collection players /backups/players_20260308/academy_saas/players.bson
```

### Backup Automático (Cron)
```bash
#!/bin/bash
# /opt/scripts/backup-mongo.sh
BACKUP_DIR="/backups/mongo"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db academy_saas --out "$BACKUP_DIR/$DATE" --gzip
# Opcional: subir a S3
# aws s3 sync "$BACKUP_DIR/$DATE" "s3://academyos-backups/$DATE"
# Limpiar backups de más de 30 días
find "$BACKUP_DIR" -mtime +30 -type d -exec rm -rf {} +
```

---

## 20. Checklist Pre-Despliegue

```
INFRAESTRUCTURA
  [ ] Servidor/servicio cloud provisionado
  [ ] MongoDB accesible (local, Atlas, o administrado)
  [ ] Dominio configurado con DNS apuntando al servidor
  [ ] SSL/TLS habilitado

BACKEND
  [ ] Python 3.10+ instalado
  [ ] requirements.txt instalado correctamente
  [ ] .env configurado con todas las variables
  [ ] JWT_SECRET generado de forma segura (openssl rand -hex 32)
  [ ] MONGO_URL apuntando a la instancia correcta
  [ ] CORS configurado con dominios de producción
  [ ] Backend responde en /api/health
  [ ] Seed ejecutado (POST /api/seed) si es primera instalación

FRONTEND
  [ ] Node.js 18+ instalado
  [ ] yarn install ejecutado sin errores
  [ ] REACT_APP_BACKEND_URL configurado con dominio de producción
  [ ] yarn build ejecutado exitosamente
  [ ] Archivos de build servidos correctamente
  [ ] SPA routing configurado (try_files → index.html)

SEGURIDAD
  [ ] HTTPS habilitado
  [ ] Firewall configurado (solo 22, 80, 443)
  [ ] MongoDB con autenticación habilitada
  [ ] .env excluido de Git (.gitignore)
  [ ] Headers de seguridad configurados en Nginx

MONITOREO
  [ ] Logs accesibles (journalctl o docker logs)
  [ ] Health check configurado
  [ ] Backup automático de MongoDB programado
  [ ] Alertas de uptime configuradas

FUNCIONALIDAD
  [ ] Login funciona con credenciales de demo
  [ ] Dashboard carga con datos
  [ ] Subida de archivos funciona (fotos de jugadores)
  [ ] Los 7 idiomas funcionan correctamente
  [ ] Exportar CSV/PDF funciona desde Reports
```

---

## API Endpoints (Referencia Rápida)

| Método | Ruta                                  | Descripción                      |
|--------|---------------------------------------|----------------------------------|
| GET    | `/api/health`                         | Health check                     |
| POST   | `/api/seed`                           | Poblar datos de demostración     |
| POST   | `/api/auth/signup`                    | Registro de usuario              |
| POST   | `/api/auth/login`                     | Login (retorna JWT)              |
| GET    | `/api/auth/me`                        | Usuario actual                   |
| GET    | `/api/dashboard`                      | Stats del dashboard              |
| GET    | `/api/players`                        | Listar jugadores                 |
| POST   | `/api/players`                        | Crear jugador                    |
| GET    | `/api/players/{id}`                   | Detalle de jugador               |
| PUT    | `/api/players/{id}`                   | Actualizar jugador               |
| DELETE | `/api/players/{id}`                   | Eliminar jugador                 |
| GET    | `/api/teams`                          | Listar equipos                   |
| POST   | `/api/teams`                          | Crear equipo                     |
| GET    | `/api/teams/{id}`                     | Detalle de equipo                |
| GET    | `/api/training`                       | Sesiones de entrenamiento        |
| POST   | `/api/training`                       | Crear sesión                     |
| POST   | `/api/training/{id}/attendance`       | Registrar asistencia             |
| GET    | `/api/matches`                        | Listar partidos                  |
| POST   | `/api/matches`                        | Crear partido                    |
| GET    | `/api/matches/{id}`                   | Detalle de partido               |
| PUT    | `/api/matches/{id}`                   | Actualizar partido               |
| GET    | `/api/calendar`                       | Eventos del calendario           |
| POST   | `/api/calendar`                       | Crear evento                     |
| GET    | `/api/scouting`                       | Evaluaciones                     |
| POST   | `/api/scouting`                       | Crear evaluación                 |
| GET    | `/api/announcements`                  | Anuncios                         |
| POST   | `/api/announcements`                  | Crear anuncio                    |
| GET    | `/api/seasons`                        | Listar temporadas                |
| POST   | `/api/seasons`                        | Crear temporada                  |
| GET    | `/api/seasons/{id}`                   | Detalle de temporada             |
| PUT    | `/api/seasons/{id}`                   | Actualizar temporada             |
| DELETE | `/api/seasons/{id}`                   | Eliminar temporada               |
| GET    | `/api/seasons/{id}/leaderboard`       | Tabla de clasificación           |
| GET    | `/api/notifications`                  | Listar notificaciones            |
| POST   | `/api/notifications`                  | Enviar notificación              |
| PUT    | `/api/notifications/{id}/read`        | Marcar como leída                |
| PUT    | `/api/notifications/read-all`         | Marcar todas como leídas         |
| POST   | `/api/upload`                         | Subir archivo (multipart)        |
| GET    | `/api/files/{path}`                   | Descargar archivo                |
| PUT    | `/api/user/language`                  | Actualizar idioma preferido      |
| GET    | `/api/user/language`                  | Obtener idioma preferido         |
| GET    | `/api/settings`                       | Config del club                  |
| PUT    | `/api/settings`                       | Actualizar config del club       |
| GET    | `/api/admin/users`                    | Listar usuarios (admin)          |
| PUT    | `/api/admin/users/{id}`               | Actualizar usuario               |
| DELETE | `/api/admin/users/{id}`               | Eliminar usuario                 |
| GET    | `/api/parent/players`                 | Jugadores del padre              |
| GET    | `/api/parent/schedule`                | Horario del padre                |
| GET    | `/api/parent/announcements`           | Anuncios del padre               |

---

*Documento generado el 8 de marzo de 2026 para AcademyOS v1.0*
*Para soporte: consultar PRD.md en /memory/PRD.md*

# Deployment & Infrastructure Guide

## 1. System Requirements

### Minimum Requirements (Development / Demo Mode)
- **CPU**: Dual-core x86_64 / Apple Silicon
- **RAM**: 8 GB
- **Disk Space**: 10 GB free
- **OS**: Windows 10/11, Ubuntu 20.04+, macOS Sonoma+
- **Inference**: CPU-only (supports up to 4 concurrent demo video streams)

### Recommended Production Requirements (Multi-Camera City Deployment)
- **CPU**: 8+ physical cores (Intel Xeon or AMD EPYC)
- **RAM**: 32 GB+
- **GPU**: NVIDIA RTX 3080 / 4080 / A4000 / T4 with $\ge 8\text{ GB}$ VRAM
- **Driver & CUDA**: NVIDIA Driver $\ge 535$, CUDA $\ge 12.0$, cuDNN $\ge 8.9$
- **Network**: Gigabit Ethernet with low-jitter RTSP ingress

---

## 2. Quickstart Deployment

### Option A: Automated One-Command Setup

#### Windows (PowerShell)
```powershell
git clone https://github.com/SakshamSuper/TrafficAI.git
cd TrafficAI
.\scripts\setup.ps1
```

#### Linux / macOS (Bash)
```bash
git clone https://github.com/SakshamSuper/TrafficAI.git
cd TrafficAI
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The automated script automatically:
1. Validates host prerequisites (Docker, Docker Compose, Git).
2. Generates `.env` from `.env.example` if not already present.
3. Automatically triggers YOLO model weight download (`yolo11n.pt`).
4. Builds multi-stage Docker containers.
5. Boots Redis, PostgreSQL, FastAPI Backend, Next.js Frontend, and Nginx.
6. Executes database schema migrations and seeds demo junctions (AIIMS, CP, Dhaula Kuan, ITO).

---

## 3. Docker Compose Multi-Container Orchestration

The project includes pre-configured orchestration topologies for both development and production.

```bash
# Build and boot all services in the background
docker compose up -d --build

# View real-time aggregated log stream
docker compose logs -f

# Check container health status
docker compose ps
```

### Container Topology
| Service Name | Container Image | Host Port | Internal Port | Role |
|---|---|---|---|---|
| `nginx` | `nginx:1.25-alpine` | `80`, `443` | `80`, `443` | Reverse proxy, static asset cache, WebSocket upgrade |
| `frontend` | Multi-stage Node 20 | `3000` | `3000` | Next.js 14 Standalone SSR + Client Portal |
| `backend` | Python 3.11-slim | `8000` | `8000` | FastAPI REST & WebSocket Application Gateway |
| `postgres` | `postgres:16-alpine` | `5432` | `5432` | Persistent transactional relational storage |
| `redis` | `redis:7-alpine` | `6379` | `6379` | Fast in-memory pub/sub message broker |

---

## 4. Bare Metal & Local Manual Setup

If you prefer to run services natively without Docker containers:

### Step 1: Redis & Database
```bash
# Ubuntu / Debian
sudo apt install redis-server postgresql
sudo systemctl start redis-server postgresql

# Windows (using winget or Chocolatey)
winget install Redis.Redis
```

### Step 2: Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env
# Edit .env to set DATABASE_URL and REDIS_URL

# Download YOLO model weights
python -c "from ultralytics import YOLO; YOLO('models/yolo11n.pt')"

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install

# Set environment variables
export NEXT_PUBLIC_API_URL=http://localhost:8000
export NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Start development server
npm run dev
# Or build and run production server
npm run build
npm run start
```

---

## 5. Cloud Platform Deployments

### Deploying on Render
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a **Web Service** for the backend using `backend/Dockerfile`.
3. Create a **Static Site** or **Web Service** for the frontend using `frontend/`.
4. Provision a **Render PostgreSQL** and **Render Redis** instance and bind their connection strings.

### Deploying on AWS EC2 (GPU-Accelerated)
1. Launch an `AWS EC2 g4dn.xlarge` instance (Ubuntu 22.04 with NVIDIA Deep Learning AMI).
2. Install Docker & the **NVIDIA Container Toolkit**:
   ```bash
   sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```
3. Enable GPU passthrough in `docker-compose.yml`:
   ```yaml
   backend:
     deploy:
       resources:
         reservations:
           devices:
             - driver: nvidia
               count: 1
               capabilities: [gpu]
   ```
4. Run `docker compose up -d`.

---

## 6. Environment Variables Reference

| Variable Name | Default Value | Description |
|---|---|---|
| `APP_NAME` | `AI Smart Traffic Management System` | Application display name |
| `ENVIRONMENT` | `development` | Runtime environment (`development`, `demo`, `production`) |
| `DEBUG` | `false` | Enables verbose debug logging and SQL echo |
| `SECRET_KEY` | *(Required)* | Cryptographic key for signing JWT tokens ($\ge 32\text{ chars}$) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT bearer token lifespan |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@postgres:5432/traffic` | Relational database connection string |
| `REDIS_URL` | `redis://redis:6379/0` | In-memory message broker connection string |
| `AI_MODEL_PATH` | `models/yolo11n.pt` | Path to YOLO model weights |
| `AI_CONFIDENCE_THRESHOLD` | `0.45` | Minimum confidence score for detection |
| `AI_NMS_THRESHOLD` | `0.45` | Non-maximum suppression IoU threshold |
| `MAX_CAMERAS` | `20` | Maximum concurrent stream limit |
| `FRAME_RATE` | `10` | Stream worker inference sampling rate |
| `STREAM_QUALITY` | `medium` | MJPEG JPEG quality preset (`low`, `medium`, `high`) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins array |

---

## 7. Health Checks & Disaster Recovery

### Automated Health Probes
- **Backend Liveness**: `GET /health` (returns `{"status":"healthy"}`)
- **Readiness Probe**: `GET /api/v1/health` (tests database and Redis connection readiness)

### Disaster Recovery
- **Database Backup**:
  ```bash
  docker compose exec postgres pg_dump -U postgres traffic > backup_$(date +%F).sql
  ```
- **Database Restore**:
  ```bash
  cat backup_2026-11-19.sql | docker compose exec -T postgres psql -U postgres traffic
  ```

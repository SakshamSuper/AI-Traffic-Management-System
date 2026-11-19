#Requires -Version 5.1
<#
.SYNOPSIS
    AI Smart Traffic Management System — One-Command Setup (Windows)
.DESCRIPTION
    Sets up and starts all services using Docker Compose.
    Handles env config, volume creation, DB migration, and seed data.
.EXAMPLE
    .\scripts\setup.ps1
#>

param(
    [switch]$Reset,     # Drop and recreate volumes
    [switch]$NoBuild,   # Skip Docker build step
    [switch]$Dev        # Development mode (hot reload)
)

$ErrorActionPreference = "Stop"

# ── Colors & Helpers ───────────────────────────────────────────────────────
function Write-Step  { param([string]$Msg) Write-Host "`n▶ $Msg" -ForegroundColor Cyan }
function Write-OK    { param([string]$Msg) Write-Host "  ✓ $Msg" -ForegroundColor Green }
function Write-Warn  { param([string]$Msg) Write-Host "  ⚠ $Msg" -ForegroundColor Yellow }
function Write-Error2{ param([string]$Msg) Write-Host "  ✗ $Msg" -ForegroundColor Red }
function Write-Info  { param([string]$Msg) Write-Host "    $Msg" -ForegroundColor Gray }

# ── Banner ─────────────────────────────────────────────────────────────────
Write-Host @"

╔══════════════════════════════════════════════════════╗
║      AI Smart Traffic Management System v1.0.0       ║
║              Production Setup — Windows              ║
╚══════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# ── Prerequisite Checks ────────────────────────────────────────────────────
Write-Step "Checking prerequisites..."

# Docker
try {
    $dockerVersion = docker --version 2>&1
    Write-OK "Docker: $dockerVersion"
} catch {
    Write-Error2 "Docker not found. Install Docker Desktop from https://docker.com/products/docker-desktop"
    exit 1
}

# Docker Compose
try {
    $composeVersion = docker compose version 2>&1
    Write-OK "Docker Compose: $composeVersion"
} catch {
    Write-Error2 "Docker Compose not available. Ensure Docker Desktop is up-to-date."
    exit 1
}

# Docker daemon running
try {
    docker info | Out-Null
    Write-OK "Docker daemon is running"
} catch {
    Write-Error2 "Docker daemon not running. Please start Docker Desktop."
    exit 1
}

# ── Environment Setup ──────────────────────────────────────────────────────
Write-Step "Configuring environment..."

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

# Root .env
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" -Destination ".env"
        Write-OK "Created .env from .env.example"
        Write-Warn "Please review and update .env with your settings"
    }
} else {
    Write-OK ".env already exists"
}

# Backend .env
if (-not (Test-Path "backend/.env")) {
    if (Test-Path "backend/.env.example") {
        Copy-Item "backend/.env.example" -Destination "backend/.env"
        Write-OK "Created backend/.env from backend/.env.example"
    } elseif (Test-Path "backend/.env.template") {
        Copy-Item "backend/.env.template" -Destination "backend/.env"
        Write-OK "Created backend/.env from template"
    } else {
        Write-Warn "No backend .env found. Backend may not start correctly."
    }
} else {
    Write-OK "backend/.env already exists"
}

# ── Directory Structure ────────────────────────────────────────────────────
Write-Step "Creating required directories..."

$dirs = @("models", "media", "media/snapshots", "media/reports", "logs")
foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Write-OK "Created: $dir/"
}

# ── Handle Reset ───────────────────────────────────────────────────────────
if ($Reset) {
    Write-Step "Resetting volumes (this will delete all data)..."
    $confirm = Read-Host "  Are you sure? This will DELETE all database data. (yes/no)"
    if ($confirm -eq "yes") {
        docker compose down -v --remove-orphans 2>&1 | Out-Null
        Write-OK "Volumes removed"
    } else {
        Write-Warn "Reset cancelled"
    }
}

# ── Docker Compose Build & Start ───────────────────────────────────────────
Write-Step "Building Docker images..."

if (-not $NoBuild) {
    docker compose build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Error2 "Docker build failed. Check the output above."
        exit 1
    }
    Write-OK "Images built successfully"
} else {
    Write-Warn "Skipping build (-NoBuild flag)"
}

Write-Step "Starting services..."
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error2 "Failed to start services."
    exit 1
}
Write-OK "Services started"

# ── Wait for Services ──────────────────────────────────────────────────────
Write-Step "Waiting for services to be healthy..."

function Wait-Service {
    param([string]$Name, [int]$Timeout = 60)
    Write-Info "Waiting for $Name..."
    $elapsed = 0
    while ($elapsed -lt $Timeout) {
        $health = docker compose ps --format json 2>&1 |
            ConvertFrom-Json -ErrorAction SilentlyContinue |
            Where-Object { $_.Service -eq $Name } |
            Select-Object -ExpandProperty Health -ErrorAction SilentlyContinue
        if ($health -eq "healthy") {
            Write-OK "$Name is healthy"
            return $true
        }
        Start-Sleep -Seconds 3
        $elapsed += 3
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    Write-Host ""
    Write-Warn "$Name health check timed out — may still be starting"
    return $false
}

Wait-Service "postgres" -Timeout 60
Wait-Service "redis" -Timeout 30

# Extra wait for backend
Write-Info "Waiting for backend API..."
Start-Sleep -Seconds 15

# ── Run Database Migrations ────────────────────────────────────────────────
Write-Step "Running database migrations..."
docker compose exec -T backend alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Migration failed — database may not be initialized (normal on first run if app auto-inits)"
} else {
    Write-OK "Database migrations applied"
}

# ── Verify Services ────────────────────────────────────────────────────────
Write-Step "Verifying service health..."

try {
    $health = Invoke-RestMethod "http://localhost:8000/health" -TimeoutSec 10
    Write-OK "Backend API: $(ConvertTo-Json $health -Compress)"
} catch {
    Write-Warn "Backend API not yet responding (may still be starting)"
}

try {
    $resp = Invoke-WebRequest "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
    Write-OK "Frontend: HTTP $($resp.StatusCode)"
} catch {
    Write-Warn "Frontend not yet responding (may still be starting)"
}

# ── Success Message ────────────────────────────────────────────────────────
Write-Host @"

╔══════════════════════════════════════════════════════╗
║               🚀 Setup Complete!                     ║
╠══════════════════════════════════════════════════════╣
║  Dashboard:    http://localhost                      ║
║  Frontend:     http://localhost:3000                 ║
║  Backend API:  http://localhost:8000                 ║
║  API Docs:     http://localhost:8000/docs            ║
║                                                      ║
║  Credentials:                                        ║
║    admin    / admin123    (full access)               ║
║    operator / operator123 (camera & signal control)  ║
║    viewer   / viewer123   (read-only)                ║
╠══════════════════════════════════════════════════════╣
║  Useful Commands:                                    ║
║    docker compose logs -f backend                    ║
║    docker compose ps                                 ║
║    docker compose down                               ║
╚══════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

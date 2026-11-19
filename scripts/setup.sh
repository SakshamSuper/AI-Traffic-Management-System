#!/bin/bash
echo "Starting Setup..."
if [ ! -f .env ]; then cp .env.example .env; fi
if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env 2>/dev/null || true; fi
mkdir -p models
docker compose up -d
sleep 10
docker compose exec backend alembic upgrade head
echo "Setup completed successfully! Visit http://localhost"

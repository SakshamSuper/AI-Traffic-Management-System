#!/bin/bash
docker compose down -v
docker compose up -d postgres redis
sleep 5
docker compose up -d backend
sleep 5
docker compose exec backend alembic upgrade head
echo "Database reset complete."

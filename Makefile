up:
	docker compose up -d
down:
	docker compose down
build:
	docker compose build
logs:
	docker compose logs -f
migrate:
	docker compose exec backend alembic upgrade head
test:
	docker compose exec backend pytest
clean:
	docker compose down -v
shell-backend:
	docker compose exec backend /bin/bash

dev:
	docker compose up

build-dev:
	docker compose up --build

down:
	docker compose down

prune:
	docker system prune -af

logs:
	docker compose logs -f

restart:
	docker compose restart

backend:
	docker compose exec backend bash

ai:
	docker compose exec ai-services bash

mongo:
	docker compose exec mongodb mongosh

redis:
	docker compose exec redis redis-cli
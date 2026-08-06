# ---- Core (spec-required) ----
dev:
	docker compose up --detach --wait
	@echo "Devflow is ready at http://localhost:3100"

build-dev:
	docker compose up --build --detach --wait
	@echo "Devflow is ready at http://localhost:3100"

down:
	docker compose down

prune:
	docker system prune -af

logs:
	docker compose logs -f

# ---- Convenience ----
up-backend:        ## Bring up only the API stack (no dockerized frontend build)
	docker compose up -d backend ai-services redis postgres

restart:
	docker compose restart

ps:
	docker compose ps

health:
	@curl -s http://localhost:8010/health | python3 -m json.tool || true
	@curl -s http://localhost:8011/health | python3 -m json.tool || true

frontend-dev:      ## Run the Next.js frontend locally on :3100
	cd frontend && npm run dev -- -p 3100

# ---- Shells ----
backend:
	docker compose exec backend bash

ai:
	docker compose exec ai-services bash

postgres:
	docker compose exec postgres psql -U devflow -d devflow

redis:
	docker compose exec redis redis-cli

.PHONY: help dev build-dev up down restart ps logs health prune frontend-dev backend ai langflow postgres redis

help:
	@echo "Devflow Management Commands:"
	@echo "  make dev          - Start all containers in background"
	@echo "  make build-dev    - Rebuild and start all containers in background"
	@echo "  make up           - Alias for make dev"
	@echo "  make down         - Stop and remove all containers"
	@echo "  make logs         - Tail logs from all containers"
	@echo "  make ps           - List status of all containers"
	@echo "  make health       - Check health endpoints of running services"
	@echo "  make restart      - Restart all services"
	@echo "  make prune        - Clean up unused Docker resources"

dev:
	docker compose up --detach --wait
	@echo "======================================================="
	@echo "  Devflow is ready in Docker Desktop!"
	@echo "  Frontend:    http://localhost:3000"
	@echo "  Backend API: http://localhost:8000/docs"
	@echo "  AI Services: http://localhost:8001/docs"
	@echo "  Langflow UI: http://localhost:7860"
	@echo "======================================================="

build-dev:
	docker compose up --build --detach --wait
	@echo "======================================================="
	@echo "  Devflow is built & ready in Docker Desktop!"
	@echo "  Frontend:    http://localhost:3000"
	@echo "  Backend API: http://localhost:8000/docs"
	@echo "  AI Services: http://localhost:8001/docs"
	@echo "  Langflow UI: http://localhost:7860"
	@echo "======================================================="

up: dev

down:
	docker compose down --remove-orphans

prune:
	docker system prune -af

logs:
	docker compose logs -f

# ---- Convenience ----
up-backend:        ## Bring up API stack & Langflow (no dockerized frontend build)
	docker compose up -d backend ai-services langflow redis postgres

restart:
	docker compose restart

ps:
	docker compose ps

health:
	@echo "--- Backend Health ---"
	@curl -sf http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -sf http://localhost:8000/health || echo "Backend unreachable"
	@echo "\n--- AI Services Health ---"
	@curl -sf http://localhost:8001/health | python3 -m json.tool 2>/dev/null || curl -sf http://localhost:8001/health || echo "AI Services unreachable"
	@echo "\n--- Langflow Health ---"
	@curl -sf http://localhost:7860/health || echo "Langflow unreachable"

frontend-dev:      ## Run Next.js locally on :3000
	cd frontend && npm run dev -- -p 3000

# ---- Shells ----
backend:
	docker compose exec backend bash

ai:
	docker compose exec ai-services bash

langflow:
	docker compose exec langflow bash

postgres:
	docker compose exec postgres psql -U devflow -d devflow

redis:
	docker compose exec redis redis-cli

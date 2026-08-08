# ---- Core (spec-required) ----
free-ports:
	@echo "Checking and freeing conflicting ports (8000, 8001, 3000, 7860, 5432, 6379)..."
	@docker --context default stop $$(docker --context default ps -q) 2>/dev/null || true
	@fuser -k 8000/tcp 8001/tcp 3000/tcp 7860/tcp 5432/tcp 6379/tcp 2>/dev/null || true
	@sleep 1

dev: free-ports
	docker compose up --detach --wait
	@echo "======================================================="
	@echo "  Devflow is ready in Docker Desktop!"
	@echo "  Frontend:    http://localhost:3000"
	@echo "  Backend API: http://localhost:8000/docs"
	@echo "  AI Services: http://localhost:8001/docs"
	@echo "  Langflow UI: http://localhost:7860"
	@echo "======================================================="

build-dev: free-ports
	docker compose up --build --detach --wait
	@echo "======================================================="
	@echo "  Devflow is built & ready in Docker Desktop!"
	@echo "  Frontend:    http://localhost:3000"
	@echo "  Backend API: http://localhost:8000/docs"
	@echo "  AI Services: http://localhost:8001/docs"
	@echo "  Langflow UI: http://localhost:7860"
	@echo "======================================================="

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
	@curl -s http://localhost:8000/health | python3 -m json.tool || true
	@echo "--- AI Services Health ---"
	@curl -s http://localhost:8001/health | python3 -m json.tool || true
	@echo "--- Langflow Health ---"
	@curl -s http://localhost:7860/health || true

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

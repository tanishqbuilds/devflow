LLM_MODEL ?= qwen3

# ---- Core (spec-required) ----
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

# ---- Convenience ----
up-backend:        ## Bring up only the API stack (no dockerized frontend build)
	docker compose up -d backend ai-services redis mongodb ollama

restart:
	docker compose restart

ps:
	docker compose ps

models:            ## Pull the configured LLM into the Ollama container
	docker compose exec ollama ollama pull $(LLM_MODEL)

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

mongo:
	docker compose exec mongodb mongosh

redis:
	docker compose exec redis redis-cli

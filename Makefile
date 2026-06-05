COMPOSE_FILE := deployments/compose.yml
SERVICE := webvim

.PHONY: help dev build preview docker-build docker-up docker-down docker-logs docker-ps docker-restart docker-clean

help:
	@echo "Available commands:"
	@echo "  make dev            Run Vite dev server"
	@echo "  make build          Build Vite app"
	@echo "  make preview        Preview built Vite app"
	@echo "  make docker-build   Build Docker image"
	@echo "  make docker-up      Build and start container"
	@echo "  make docker-down    Stop and remove container"
	@echo "  make docker-logs    Follow container logs"
	@echo "  make docker-ps      Show compose services"
	@echo "  make docker-restart Restart container"
	@echo "  make docker-clean   Stop and remove container/images/orphans"

dev:
	pnpm dev

build:
	pnpm build

preview:
	pnpm preview

docker-build:
	docker compose -f $(COMPOSE_FILE) build

docker-up:
	docker compose -f $(COMPOSE_FILE) up --build -d

docker-down:
	docker compose -f $(COMPOSE_FILE) down

docker-logs:
	docker compose -f $(COMPOSE_FILE) logs -f $(SERVICE)

docker-ps:
	docker compose -f $(COMPOSE_FILE) ps

docker-restart:
	docker compose -f $(COMPOSE_FILE) restart $(SERVICE)

docker-clean:
	docker compose -f $(COMPOSE_FILE) down --rmi local --remove-orphans

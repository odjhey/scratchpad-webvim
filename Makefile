COMPOSE_FILE := deployments/compose.yml
ENV_FILE ?= deployments/.env-local
SERVICE := webvim

COMPOSE := docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE)

.PHONY: help dev build preview ensure-env docker-build docker-up docker-down docker-logs docker-ps docker-restart docker-clean

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
	@echo ""
	@echo "Variables:"
	@echo "  ENV_FILE=$(ENV_FILE)"

dev:
	pnpm dev

build:
	pnpm build

preview:
	pnpm preview

ensure-env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "Creating $(ENV_FILE) from deployments/.env-local.example"; \
		cp deployments/.env-local.example "$(ENV_FILE)"; \
	fi

docker-build: ensure-env
	$(COMPOSE) build

docker-up: ensure-env
	$(COMPOSE) up --build -d

docker-down: ensure-env
	$(COMPOSE) down

docker-logs: ensure-env
	$(COMPOSE) logs -f $(SERVICE)

docker-ps: ensure-env
	$(COMPOSE) ps

docker-restart: ensure-env
	$(COMPOSE) restart $(SERVICE)

docker-clean: ensure-env
	$(COMPOSE) down --rmi local --remove-orphans

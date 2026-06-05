COMPOSE_FILE := deployments/compose.yml
ENV_FILE ?= deployments/.env-local

COMPOSE := docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE)

.PHONY: build docker-build docker-up docker-clean ensure-env

ensure-env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "Creating $(ENV_FILE) from deployments/.env-local.example"; \
		cp deployments/.env-local.example "$(ENV_FILE)"; \
	fi

build:
	pnpm build

docker-build: ensure-env
	$(COMPOSE) build

docker-up: ensure-env
	$(COMPOSE) up --build -d

docker-clean: ensure-env
	$(COMPOSE) down --rmi local --remove-orphans

.PHONY: help up down dev prod v

DEV_SERVICES := frontend-dev backend-dev redis-dev
PROD_SERVICES := frontend-prod backend-prod redis-prod

ENV := $(if $(filter prod,$(MAKECMDGOALS)),prod,dev)
SERVICES := $(if $(filter prod,$(MAKECMDGOALS)),$(PROD_SERVICES),$(DEV_SERVICES))
WITH_VOLUMES := $(filter v,$(MAKECMDGOALS))

help:
	@echo "Use exactly these commands:"
	@echo "  make up dev"
	@echo "  make down dev v"
	@echo "  make up prod"
	@echo "  make down prod v"
	@echo "  make down prod"
	@echo "  make down dev"

up:
	docker compose --profile $(ENV) up --build -d

down:
	docker compose stop $(SERVICES)
	docker compose rm -f $(SERVICES)
	@if [ "$(WITH_VOLUMES)" != "" ]; then \
		echo "Removing named volumes for $(ENV)..."; \
		docker volume ls -q | grep -E '_redis_data_$(ENV)$$' | xargs -r docker volume rm; \
	fi

dev prod v:
	@:

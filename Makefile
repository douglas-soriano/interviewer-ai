.PHONY: install bootstrap dev build start typecheck db-up db-down db-logs db-generate db-push db-seed

install:
	npm install

bootstrap:
	npm install
	docker compose up -d db
	npm run db:push
	npm run db:seed

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

typecheck:
	npm run typecheck

db-up:
	docker compose up -d db

db-down:
	docker compose down

db-logs:
	docker compose logs -f db

db-generate:
	npm run db:generate

db-push:
	npm run db:push

db-seed:
	npm run db:seed

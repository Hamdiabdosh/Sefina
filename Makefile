.PHONY: dev-up dev-down dev-verify dev-logs dev-reset-db

# One-command local backend: Postgres + PgBouncer + API + MailHog, migrate, seed, login test
dev-up:
	./scripts/setup-dev.sh

dev-down:
	docker compose down

dev-verify:
	./scripts/verify-dev.sh

dev-logs:
	docker compose logs -f backend

# Wipe DB volume and re-run full setup (destructive)
dev-reset-db:
	docker compose down -v
	./scripts/setup-dev.sh

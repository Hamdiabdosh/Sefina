.PHONY: dev-up dev-down dev-verify dev-verify-seed dev-verify-m05 dev-verify-m06 dev-verify-m07 dev-verify-m08 dev-verify-m09 dev-verify-m10 dev-logs dev-reset-db dev-seed dev-backend-deps

# One-command local backend: Postgres + PgBouncer + API + MailHog, migrate, seed, login test
dev-up:
	./scripts/setup-dev.sh

dev-down:
	docker compose down

dev-verify:
	./scripts/verify-dev.sh

dev-seed:
	docker exec sefinet-backend-dev npm run db:seed:all

dev-verify-seed:
	./scripts/verify-seed-dev.sh

dev-verify-m05:
	./scripts/verify-m05-student-api.sh

dev-verify-m06:
	./scripts/verify-m06-attendance-api.sh

dev-verify-m07:
	./scripts/verify-m07-grades-api.sh

dev-verify-m08:
	./scripts/verify-m08-fees-api.sh

dev-verify-m09:
	./scripts/verify-m09-salaries-api.sh

dev-verify-m10:
	./scripts/verify-m10-reports-api.sh

dev-logs:
	docker compose logs -f backend

# Refresh backend node_modules in Docker after dependency changes (same volume as running backend)
dev-backend-deps:
	docker compose run --rm --no-deps backend npm ci
	docker compose restart backend

# Wipe DB volume and re-run full setup (destructive)
dev-reset-db:
	docker compose down -v
	./scripts/setup-dev.sh

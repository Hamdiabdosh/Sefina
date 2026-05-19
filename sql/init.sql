-- Sefinet Al Neja — Database Initialization
-- Runs once when PostgreSQL container is first created
-- Creates the app user with limited rights

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sefinet_app') THEN
    CREATE ROLE sefinet_app WITH LOGIN PASSWORD 'apppassword123';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE sefinet_db TO sefinet_app;
GRANT USAGE ON SCHEMA public TO sefinet_app;

-- Hard delete is forbidden in Sefinet Al Neja
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO sefinet_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sefinet_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO sefinet_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO sefinet_app;

-- AuditLog INSERT-only rules: apply after Prisma migrations (see rls-policies.sql)

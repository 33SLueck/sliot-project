# Sliot Headless Ecommerce CMS - New Architecture Plan

## Overview
A modern, maintainable, and secure architecture for a headless ecommerce CMS with automation workflows. This setup uses Next.js for frontend and backend logic, Prisma/Postgres for data, n8n for automation, Cognito for authentication, and S3 for file management—all orchestrated via Docker Compose.

---

## Components

### 1. Next.js (Frontend & Backend)
- Handles all UI, API routes, and server actions.
- Connects directly to Prisma/Postgres for data access.
- Provides admin/editor UI and public API endpoints.
- Runs inside a Docker container.

### 2. Postgres + Prisma
- Postgres database for all CMS and ecommerce data.
- Prisma ORM for schema, migrations, and queries.
- Runs inside a Docker container.

### 3. n8n (Automation)
- Handles workflows, integrations, and automations (orders, emails, etc.).
- Exposed at `n8n.sliot.de` via reverse proxy.
- Requires its own Postgres database (separate from CMS DB).
- Runs inside a Docker container.

### 4. Cognito (Authentication)
- AWS Cognito for user authentication and management.
- Integrated with Next.js (e.g., via NextAuth.js).

### 5. S3 (File Management)
- AWS S3 for storing and serving media/files.
- Integrated with Next.js and n8n as needed.

### 6. Docker Compose
- Orchestrates all services: Next.js, Postgres (CMS), Postgres (n8n), n8n.
- Simplifies local development and production deployment.

### 7. AWS Parameter Store (SSM)
- Stores all secrets and sensitive config (DB credentials, Cognito secrets, S3 keys).
- Loaded at container startup via entrypoint script.

---

## Domain Routing
- `sliot.de` → Next.js frontend/backend
- `n8n.sliot.de` → n8n automation UI/API

---

## Security & Best Practices
- All secrets/config from AWS Parameter Store (no sensitive `.env` files).
- Minimal, versioned `.env` for non-sensitive static config only.
- Internal Docker networking for service-to-service communication.
- External access only via reverse proxy (Nginx/Traefik).
- Health checks and clear error messages for missing config.

---

## Example Docker Compose Services
```yaml
services:
  nextjs:
    build: ./frontend
    environment:
      # Loaded from SSM at startup
      DATABASE_URL: ...
      COGNITO_CLIENT_ID: ...
      S3_KEY: ...
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ...
      POSTGRES_PASSWORD: ...
      POSTGRES_DB: ...
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  n8n:
    image: n8nio/n8n:latest
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: n8n-postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: ...
      DB_POSTGRESDB_USER: ...
      DB_POSTGRESDB_PASSWORD: ...
    ports:
      - "5678:5678"
    depends_on:
      - n8n-postgres

  n8n-postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ...
      POSTGRES_PASSWORD: ...
      POSTGRES_DB: ...
    volumes:
      - n8n_postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

volumes:
  postgres_data:
  n8n_postgres_data:
```

---

## Next Steps
1. Scaffold new Next.js app with Prisma/Postgres.
2. Add n8n and its own Postgres to Docker Compose.
3. Set up AWS Parameter Store for all secrets.
4. Integrate Cognito and S3 as needed.
5. Document all required SSM parameters and environment variables.
6. Use a startup script to load secrets from SSM at container startup.
7. Set up reverse proxy for domain routing.

---

## Summary
This architecture is secure, simple, and cloud-native. All secrets are managed centrally, containers are isolated, and automation is handled by n8n. Next.js provides both frontend and backend logic, making the stack easy to maintain and extend for ecommerce and CMS needs.

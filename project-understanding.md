# Project Overview

Based on reading the project files. Nothing was run. The repo has no README (the latest commit is "Removed all documentation"), so everything below comes from config and source files.

## What it does

A small storefront: a Spring Boot REST backend and a React single-page app.

- **Catalog.** `GET /api/v1/categories` and `GET /api/v1/products`. Products accept optional `search` and `categoryId` parameters (`backend/src/main/java/org/learningfromexperience/ecomstore/catalog/CatalogController.java:23-34`).
- **Orders.** `POST /api/v1/orders`. Its annotation says "400 invalid request, 409 insufficient stock" (`.../order/OrderController.java:24-29`).
- **Frontend pages.** Catalog, cart, checkout and confirmation (`frontend/src/App.tsx:12-15`). `frontend/src/api.ts:28-43` calls the same three endpoints.
- **Data.** Flyway is enabled (`backend/src/main/resources/application.properties:10`) and Hibernate only validates the schema (`:7`). The migrations are `db/migration/V1__create_schema.sql` and `V2__seed_categories_and_products.sql`. The migration files were not opened, so their contents are not confirmed.

## Tech stack

| Layer | Technology | Evidence |
|---|---|---|
| Backend | Java 25, Spring Boot 4.1.2 | `backend/pom.xml:8,30` |
| Backend libraries | webmvc, data-jpa, validation, flyway (+ flyway-mysql), MySQL Connector/J, springdoc 3.2.0 | `backend/pom.xml:34-63` |
| Database | MySQL 8.4 (Docker) | `compose.yaml:3` |
| Frontend | React 19, react-router-dom 7, Vite 8, Tailwind 4, TypeScript 7 | `frontend/package.json:12-25` |
| Tests | `@SpringBootTest` + MockMvc against a separate `ecomstore_test` database | `backend/src/test/java/.../AbstractApiTest.java:15-17`, `backend/src/test/resources/application-test.properties:2` |

## How to run locally

1. **Start MySQL.** From the repo root, run `docker compose up -d` (`compose.yaml`).
   - It creates `ecomstore_db` with user and password `ecomstore` (`compose.yaml:7-11`).
   - `docker/mysql/init/01-create-test-database.sql:3-4` also creates `ecomstore_test` and grants access.
   - That script runs only on a fresh data volume (its own comment, line 1). An older volume will not have the test database.
2. **Start the backend.** From `backend/`, run `mvn spring-boot:run`.
   - It connects to `localhost:3306/ecomstore_db` (`application.properties:3-5`).
   - It needs JDK 25 (`pom.xml:30`).
   - No Maven wrapper was found in the repo, so Maven must be installed.
3. **Start the frontend.** From `frontend/`, run `npm install` and then `npm run dev` (`package.json:7`).
   - It serves on port 5173 with `strictPort` (`frontend/vite.config.ts:8`).
   - The API base URL is `VITE_API_BASE_URL`, falling back to `http://localhost:8080` (`frontend/src/api.ts:3`). `frontend/.env.example` holds the same value.
   - The backend allows CORS only from `http://localhost:5173`, for `/api/**` with GET, POST and OPTIONS (`.../config/CorsConfig.java:12-15`).
4. **Run the checks.**
   - Backend tests: `mvn test` in `backend/`. They need `ecomstore_test` to exist.
   - Frontend: `npm run typecheck` and `npm run build` (`package.json:8-9`).

## Cannot confirm

- **Backend port.** No `server.port` is set anywhere under `backend/src`. 8080 would be Spring Boot's default, not a project setting. The frontend's fallback URL does assume 8080.
- **Swagger UI location.** springdoc is a dependency and the controllers have OpenAPI annotations. No config sets the UI path, so its URL is not confirmed.
- **Migration contents.** The seed data was not read.
- **That any of it runs.** No command was executed, and I did not check that JDK 25, Maven, Node or Docker are installed.
- **Earlier docs.** I did not look at git history, so I don't know what the removed documentation said.

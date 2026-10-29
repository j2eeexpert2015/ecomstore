# EcomStore

## Goal

EcomStore is a small online store where customers browse a single product catalog, search and filter it, build a shopping cart, and place an order with order confirmation. No login is required.

The functional requirements are in [docs/requirements.md](docs/requirements.md); backend decisions are in [docs/backend-design.md](docs/backend-design.md).

## Status

| Part | Status |
|---|---|
| Backend | Implemented: catalog, search/filter and order placement REST API, MySQL, Flyway, OpenAPI, 21 automated tests passing |
| Frontend | Implemented: React + TypeScript + Vite + Tailwind catalog, cart, checkout and confirmation. Type-check and production build pass; the browser walkthrough in section 9 is a manual test that has not been performed |

## 1. Prerequisites

| Tool | Check command | Expected |
|---|---|---|
| JDK 25 | `java -version` | `25.x` |
| Maven (system install, not the wrapper) | `mvn -v` | Maven 3.9+ running on Java 25 |
| Docker with Compose | `docker --version` and `docker compose version` | any current version; Docker Desktop must be running |

`mvn -v` must report **Java version: 25**. If it shows another JDK, set `JAVA_HOME` for the current terminal first.

PowerShell:

```powershell
$env:JAVA_HOME = "C:\path\to\jdk-25"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

CMD:

```bat
set JAVA_HOME=C:\path\to\jdk-25
set PATH=%JAVA_HOME%\bin;%PATH%
```

## 2. Database setup

Run from the **project root** (the folder containing `compose.yaml`); the same commands work in PowerShell and CMD:

```text
docker compose up -d --wait
docker compose ps
```

Expected: service `mysql` is `healthy` (first start takes about 20–40 seconds).

| Item | Value |
|---|---|
| Image / port | `mysql:8.4`, `localhost:3306` |
| Application database | `ecomstore_db` |
| Test database | `ecomstore_test` (used only by `mvn verify`) |
| User / password | `ecomstore` / `ecomstore` (root password: `rootpassword`) |
| Data volume | `ecomstore_mysql_data` |

Docker creates the user from `MYSQL_USER`/`MYSQL_PASSWORD`. On a **fresh volume only**, `docker/mysql/init/01-create-test-database.sql` also creates `ecomstore_test` and grants the user access to it. It does not create tables; Flyway does that (section 5).

## 3. Project structure

One tree for the whole project (generated folders such as `node_modules`, `dist` and `target` are omitted):

```text
ecomstore/
├── README.md                          # this runbook
├── compose.yaml                       # MySQL 8.4 service "mysql" (port 3306, volume, health check)
├── docker/mysql/init/
│   └── 01-create-test-database.sql    # fresh-volume init: creates ecomstore_test + grants
├── docs/
│   ├── requirements.md                # functional requirements (IDs CAT-/CART-/CHK-)
│   ├── backend-design.md              # backend design decisions
│   └── frontend-design.md             # frontend design decisions
├── backend/
│   ├── pom.xml                        # Spring Boot 4.1.2, Java 25, dependencies
│   └── src/
│       ├── main/
│       │   ├── java/org/learningfromexperience/ecomstore/
│       │   │   ├── BackendApplication.java        # main class
│       │   │   ├── catalog/                       # categories + products
│       │   │   │   ├── CatalogController.java     # GET /api/v1/categories, /api/v1/products
│       │   │   │   ├── CatalogService.java        # search/filter logic
│       │   │   │   ├── Category.java, Product.java                      # JPA entities
│       │   │   │   ├── CategoryRepository.java, ProductRepository.java  # queries, atomic stock decrement
│       │   │   │   └── CategoryResponse.java, ProductResponse.java      # API records
│       │   │   ├── order/                         # checkout
│       │   │   │   ├── OrderController.java       # POST /api/v1/orders
│       │   │   │   ├── OrderService.java          # transactional order placement
│       │   │   │   ├── Order.java, OrderItem.java, OrderRepository.java
│       │   │   │   ├── OrderRequest.java, OrderResponse.java            # API records + validation rules
│       │   │   │   └── InsufficientStockException.java, InvalidOrderException.java
│       │   │   ├── web/ApiExceptionHandler.java   # ProblemDetail 400 / 409 mapping
│       │   │   └── config/CorsConfig.java         # CORS for /api/** from http://localhost:5173
│       │   └── resources/
│       │       ├── application.properties         # datasource (ecomstore_db), JPA validate, Flyway
│       │       └── db/migration/
│       │           ├── V1__create_schema.sql                # tables
│       │           └── V2__seed_categories_and_products.sql # seed data
│       └── test/
│           ├── java/org/learningfromexperience/ecomstore/
│           │   ├── AbstractApiTest.java       # shared setup, resets ecomstore_test per test
│           │   ├── CatalogApiTest.java        # catalog / search / filter tests
│           │   └── OrderApiTest.java          # order, validation, stock, rollback tests
│           └── resources/application-test.properties  # points tests at ecomstore_test
└── frontend/
    ├── package.json                   # scripts (dev, typecheck, build) and dependencies
    ├── vite.config.ts                 # Vite + React + Tailwind plugins, port 5173
    ├── tsconfig.json                  # TypeScript strict config
    ├── index.html                     # page shell
    ├── .env.example                   # VITE_API_BASE_URL template
    └── src/
        ├── main.tsx                   # entry point: router + cart provider
        ├── App.tsx                    # routes
        ├── index.css                  # Tailwind import + navy theme colors
        ├── api.ts                     # API client (categories, products, place order) + ApiError
        ├── types.ts                   # API request/response types
        ├── format.ts                  # USD formatting
        ├── lastOrder.ts               # in-memory order for the confirmation page
        ├── cart/CartContext.tsx       # cart state, localStorage persistence
        ├── components/
        │   ├── Layout.tsx             # navy header (search, cart count), footer
        │   ├── StockBadge.tsx         # green / amber / red availability badge
        │   └── Message.tsx            # loading / empty / error notice box
        └── pages/
            ├── CatalogPage.tsx        # product cards, category pills, search results
            ├── CartPage.tsx           # quantities, subtotals, total
            ├── CheckoutPage.tsx       # customer form, validation, shortage errors
            └── ConfirmationPage.tsx   # confirmation from the POST response
```

## 4. Database schema and sample data

| Table | Column | SQL type | Key / constraint | Purpose |
|---|---|---|---|---|
| `categories` | `id` | BIGINT AUTO_INCREMENT | PK | Category identifier |
| | `name` | VARCHAR(100) | NOT NULL, UNIQUE | Category name shown in filters |
| `products` | `id` | BIGINT AUTO_INCREMENT | PK | Product identifier |
| | `name` | VARCHAR(150) | NOT NULL | Product name (searched) |
| | `description` | VARCHAR(500) | NOT NULL | Short description |
| | `price` | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Current authoritative USD price |
| | `stock` | INT | NOT NULL, CHECK >= 0 | Units available |
| | `category_id` | BIGINT | NOT NULL, FK → `categories.id` | Product's category |
| `orders` | `id` | BIGINT AUTO_INCREMENT | PK | Internal order id |
| | `order_number` | VARCHAR(40) | NOT NULL, UNIQUE | Customer-facing order number (`ORD-…`) |
| | `customer_name` | VARCHAR(200) | NOT NULL | Customer full name |
| | `customer_email` | VARCHAR(254) | NOT NULL | Customer email |
| | `shipping_address` | VARCHAR(500) | NOT NULL | Shipping address |
| | `total_amount` | DECIMAL(12,2) | NOT NULL | Server-calculated order total |
| | `created_at` | DATETIME(6) | NOT NULL | Order date/time (UTC) |
| `order_items` | `id` | BIGINT AUTO_INCREMENT | PK | Line identifier |
| | `order_id` | BIGINT | NOT NULL, FK → `orders.id` | Owning order |
| | `product_id` | BIGINT | NOT NULL, FK → `products.id` | Product ordered |
| | `product_name` | VARCHAR(150) | NOT NULL | Product name at order time |
| | `unit_price` | DECIMAL(10,2) | NOT NULL | Price at order time |
| | `quantity` | INT | NOT NULL, CHECK > 0 | Units ordered |
| | `subtotal` | DECIMAL(12,2) | NOT NULL | `unit_price × quantity` |

Relationships: a category has many products; an order has many order items; each order item references one product. `flyway_schema_history` is Flyway's own bookkeeping table.

Seeded products (IDs from a freshly migrated database):

| ID | Product | Category | Price | Stock | Purpose |
|---|---|---|---|---|---|
| 1 | Wireless Headphones | Electronics | 129.99 | 10 | Happy-path order (2 × = 259.98, stock 10 → 8) |
| 2 | Mechanical Keyboard | Electronics | 89.50 | 15 | Search ("key") + category filter demo |
| 3 | Clean Code | Books | 34.95 | 20 | Books category filter |
| 4 | Spring Boot in Practice | Books | 44.00 | 10 | Books category filter |
| 5 | Espresso Machine | Home & Kitchen | 249.99 | 3 | Low stock; insufficient-stock demo (order 4) |
| 6 | Water Bottle | Home & Kitchen | 24.99 | 25 | Multi-item order totals |

Inspect (from the project root, works in PowerShell and CMD):

```text
docker compose exec mysql mysql -uecomstore -pecomstore ecomstore_db -e "SELECT p.id, p.name, c.name AS category, p.price, p.stock FROM products p JOIN categories c ON c.id = p.category_id ORDER BY p.id"
```

## 5. Flyway migrations

Files are in `backend/src/main/resources/db/migration/` and run in version order:

| Order | Version | File | Purpose |
|---|---|---|---|
| 1 | 1 | `V1__create_schema.sql` | Creates `categories`, `products`, `orders`, `order_items` |
| 2 | 2 | `V2__seed_categories_and_products.sql` | **Seeds** 3 categories and 6 products |

- Migrations run automatically when the backend starts (against `ecomstore_db`) and when the test context starts (against `ecomstore_test`). Already-applied versions are skipped.
- Three different things change a database: **Docker initialization** (user + `ecomstore_test`, fresh volume only), **Flyway migrations** (schema and seed data, every startup if pending) and **ordinary order data changes** (placing orders inserts rows and lowers stock; no migration involved).
- Applied versioned migrations must not be edited; add a new `V3__…` file for changes.

Inspect applied migrations:

```text
docker compose exec mysql mysql -uecomstore -pecomstore ecomstore_db -e "SELECT installed_rank, version, description, script, success FROM flyway_schema_history"
```

## 6. Backend tests

Working directory: `backend/` (MySQL must be running). Same command in PowerShell and CMD:

```text
mvn verify
```

Tests use the isolated `ecomstore_test` database, never `ecomstore_db`. Before each test the order tables of the test database are emptied and seed stock is restored. Last run: **21 run, 21 PASS, 0 failed, 0 skipped**, `BUILD SUCCESS`.

| # | Class | @DisplayName | Req. | Result |
|---|---|---|---|---|
| 1 | CatalogApiTest | CAT-001: lists all six products with name, description, category, price and stock | CAT-001 | PASS |
| 2 | CatalogApiTest | CAT-003: lists the three categories | CAT-003 | PASS |
| 3 | CatalogApiTest | CAT-002: search ignores case and surrounding spaces and matches substrings of the name | CAT-002 | PASS |
| 4 | CatalogApiTest | CAT-002: a blank search applies no name filter | CAT-002 | PASS |
| 5 | CatalogApiTest | CAT-003: filtering by category returns only that category's products | CAT-003 | PASS |
| 6 | CatalogApiTest | CAT-004: search and category filter work together | CAT-004 | PASS |
| 7 | CatalogApiTest | CAT-004: a search and category with no matching product return an empty list | CAT-004 | PASS |
| 8 | OrderApiTest | CHK-010: a valid order returns 201 with order number, items, subtotals, total and date/time | CHK-010 | PASS |
| 9 | OrderApiTest | CHK-008: the order total is the sum of server-side price times quantity over all items | CHK-008 | PASS |
| 10 | OrderApiTest | CHK-009: a successful order is saved and reduces stock by the ordered quantity | CHK-009 | PASS |
| 11 | OrderApiTest | CHK-010: two successful orders receive different order numbers | CHK-010 | PASS |
| 12 | OrderApiTest | CHK-001: a blank full name is rejected with 400 naming customer.fullName and nothing is saved | CHK-001 | PASS |
| 13 | OrderApiTest | CHK-001: a missing shipping address is rejected with 400 naming shippingAddress | CHK-001 | PASS |
| 14 | OrderApiTest | CHK-002: an invalid email is rejected with 400 naming customer.email | CHK-002 | PASS |
| 15 | OrderApiTest | CHK-003: an order with no items is rejected with 400 naming items | CHK-003 | PASS |
| 16 | OrderApiTest | CHK-004: zero and negative quantities are rejected with 400 identifying the item quantity | CHK-004 | PASS |
| 17 | OrderApiTest | CHK-005: an order for exactly the available stock is accepted and leaves zero stock | CHK-005 | PASS |
| 18 | OrderApiTest | CHK-006: insufficient stock returns 409 with the product, requested and available quantities | CHK-006 | PASS |
| 19 | OrderApiTest | CHK-007: when one item is short, no order is created and no stock changes for any item | CHK-007 | PASS |
| 20 | OrderApiTest | CHK-006: every short item is identified when several items are short | CHK-006 | PASS |
| 21 | OrderApiTest | CHK-004: an unknown product id is rejected with 400 naming the item and nothing changes | CHK-004 | PASS |

## 7. Run backend and test APIs with Swagger UI

Live requests change demo stock and save orders in `ecomstore_db`; nothing is reset automatically (see section 10).

**(a) Start MySQL.** In a terminal at the project root: `docker compose up -d --wait`, then `docker compose ps` must show `mysql` as `healthy`. Skip if section 2 is already done and the container is still running.

**(b) Start the backend.** Open a terminal in `backend/` (with JDK 25, see section 1) and run:

```text
mvn spring-boot:run
```

Wait for `Started BackendApplication`. This terminal now runs the app until you press Ctrl+C; use a **second terminal** for any other command.

**(c) Open Swagger UI:** <http://localhost:8080/swagger-ui/index.html>. You will see the **Categories**, **Products** and **Orders** groups. Optional raw OpenAPI document: <http://localhost:8080/v3/api-docs>.

**(d) Using an endpoint:** expand it → **Try it out** → fill parameters or edit the JSON body → **Execute** → read the HTTP status and **Response body**.

1. `GET /api/v1/categories` → 200, 3 categories.
2. `GET /api/v1/products` → 200, 6 products. Note each product's `id`; the examples below use the IDs from section 4 (Wireless Headphones = 1, Espresso Machine = 5). If your IDs differ, use the ones from your response.

**(e) `POST /api/v1/orders`** — paste a body, press Execute. IDs, order numbers and timestamps can differ on your machine.

*Successful checkout* (2 Wireless Headphones) → **201**; `totalAmount` 259.98, `items[0].subtotal` 259.98, `orderNumber` like `ORD-…`, `createdAt`; stock 10 → 8:

```json
{
  "customer": { "fullName": "Ada Lovelace", "email": "ada@example.com" },
  "shippingAddress": "1 Main St",
  "items": [ { "productId": 1, "quantity": 2 } ]
}
```

*Insufficient stock* (4 Espresso Machines) → **409**; `shortages[0]` has `productName` "Espresso Machine", `requested` 4, `available` 3; no order and no stock change:

```json
{
  "customer": { "fullName": "Ada Lovelace", "email": "ada@example.com" },
  "shippingAddress": "1 Main St",
  "items": [ { "productId": 5, "quantity": 4 } ]
}
```

*Invalid email* → **400**; `errors` contains `field` = `customer.email`:

```json
{
  "customer": { "fullName": "Ada Lovelace", "email": "not-an-email" },
  "shippingAddress": "1 Main St",
  "items": [ { "productId": 1, "quantity": 1 } ]
}
```

**(f) Confirm results.** Re-run `GET /api/v1/products`: Wireless Headphones now shows stock 8 after the success case (and Espresso Machine is still 3 after the rejection).

Optional SQL (second terminal, project root):

```text
docker compose exec mysql mysql -uecomstore -pecomstore ecomstore_db -e "SELECT id, name, stock FROM products ORDER BY id"
docker compose exec mysql mysql -uecomstore -pecomstore ecomstore_db -e "SELECT o.order_number, o.total_amount, i.product_name, i.quantity, i.subtotal FROM orders o JOIN order_items i ON i.order_id = o.id"
```

**What was actually checked.** The three request bodies above were sent with real HTTP requests (curl) against the running backend, with these results: 201 (total 259.98, stock 10 → 8), 409 (requested 4 / available 3, stock unchanged) and 400 (`customer.email`). `GET /v3/api-docs` returned OpenAPI 3.1.0 listing the three paths, `/swagger-ui/index.html` returned HTTP 200, and a CORS preflight from `http://localhost:5173` was allowed while one from another origin was rejected (403). Swagger UI itself was **not** operated in a browser; steps (c)–(f) are manual steps for the reader.

## 8. Frontend project structure and run

File layout: see the combined tree in section 3. Design notes: [docs/frontend-design.md](docs/frontend-design.md).

**Prerequisites:** Node.js and npm (checked with Node 24 / npm 11), the backend running on `http://localhost:8080` (section 7, steps a–b), and its CORS setting, which allows only the origin `http://localhost:5173`. The frontend therefore always uses port 5173 and fails to start if that port is taken.

**Configure:** the API address comes from `VITE_API_BASE_URL`. The default (`http://localhost:8080`) works without any file. To override it, copy the template in `frontend/`:

PowerShell:

```powershell
Copy-Item .env.example .env
```

CMD:

```bat
copy .env.example .env
```

**Run** (working directory `frontend/`; same commands in PowerShell and CMD):

```text
npm install
npm run typecheck
npm run build
npm run dev
```

- `npm run typecheck` runs the TypeScript check (no output means success). `npm run build` type-checks and creates a production bundle in `dist/` (not committed). No linter is configured.
- `npm run dev` starts Vite. Open <http://localhost:5173>. Press **Ctrl+C** in that terminal to stop it. Keep the backend terminal running while you use the UI.

Expected: the page shows the navy header with the search box and a cart count of 0, category pills and six product cards. If the backend is not running, the catalog shows an error with a Retry button.

## 9. Frontend UI walkthrough and verification

**MANUAL UI TEST — to be performed by the reader in a browser.** Claude did not click through the UI. The only automated frontend checks were the type-check, the production build, and requests showing that Vite serves the page and that the backend accepts the origin `http://localhost:5173`.

Start from a **freshly seeded database** (section 10) with the backend and frontend running (sections 7 and 8). Prices and stock below assume the seed data.

1. **Open the UI.** Go to <http://localhost:5173>. *Expect:* six cards — Wireless Headphones $129.99, Mechanical Keyboard $89.50, Clean Code $34.95, Spring Boot in Practice $44.00, Espresso Machine $249.99, Water Bottle $24.99. Badges: Espresso Machine amber "Only 3 left"; all others green "In stock". Header cart count is 0.
2. **Search and filter.** Type `Espresso` in the header search → only Espresso Machine remains. Click the **Home & Kitchen** pill → still Espresso Machine. Type `zzz` → "No products found." Click **Clear filters** → all six products return and the **All** pill is highlighted.
3. **Add and edit the cart.** Click **Add to Cart** on Wireless Headphones → header count becomes 1. Click **Cart** in the header and change the quantity field to `2`. *Expect:* subtotal $259.98, total $259.98, header count 2. Enter `0` or `abc` → a red message appears and the stored quantity stays 2 (click elsewhere to restore the field).
4. **Refresh.** Press F5 on the cart page. *Expect:* the same line, quantity 2, total $259.98, header count 2 (the cart is kept in the browser's localStorage).
5. **Complete checkout.** Click **Checkout**. Press **Place order** with the form empty → inline messages for full name, email and address. Enter a name, `ada@example.com` and an address, then press **Place order**. *Expect:* the confirmation page with an `ORD-…` order number, date/time, customer, address, Wireless Headphones × 2 at $129.99 = $259.98, total $259.98, and header count 0. Click **Continue shopping**: Wireless Headphones shows stock 8 (10 → 8) and the cart is empty. Optionally confirm with `GET /api/v1/products` in Swagger UI.
   The confirmation is rendered from the POST response and kept only in memory. It is not an order history or lookup page and does **not** survive a refresh (F5 returns you to the catalog).
6. **Insufficient stock.** On the catalog click **Add to Cart** on Espresso Machine, open the cart and set the quantity to `4` (the cart does not cap quantities at stock). Go to **Checkout**, enter valid details and press **Place order**. *Expect:* a red alert "Espresso Machine: requested 4, available 3", no confirmation page, and the cart still holding Espresso Machine × 4 (header count 4). Stock stays 3.

Also check: once an item's stock is 0 its card shows a red "Out of stock" badge and a disabled Add to Cart button.

## 10. Demo reset

Live orders modify demo data. To return to the original seed data:

1. Stop the backend (Ctrl+C in its terminal).
2. At the project root run:

```text
docker compose down -v
docker compose up -d --wait
```

3. Start the backend again (`mvn spring-boot:run` in `backend/`); Flyway reapplies the migrations and seed data.

**Warning:** `down -v` deletes the MySQL volume — all local orders and database data are destroyed. The fresh volume also reruns the init script, which recreates `ecomstore_test`.

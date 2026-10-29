# EcomStore Backend Design

Implements the Catalog, Cart-support and Checkout behavior in [requirements.md](requirements.md) for the backend only. The cart itself lives in the (future) frontend; the backend provides the catalog and the order operation.

## Constraints

| Area | Decision |
|---|---|
| Language / framework | Java 25, Spring Boot 4.1.2 (existing `backend/pom.xml`; coordinates `org.learningfromexperience:ecomstore`, base package `org.learningfromexperience.ecomstore`, main class `BackendApplication` unchanged) |
| Libraries | Spring MVC, Spring Data JPA, Bean Validation, Java records for DTOs, `BigDecimal` for money; no Lombok, no MapStruct |
| Build | System `mvn` (no Maven Wrapper); code and tests live in `backend/`; JUnit 5 |
| Database | MySQL 8.4 via root `compose.yaml`, service `mysql`, port 3306, named volume `ecomstore_mysql_data`, health check |
| Databases / credentials | `ecomstore_db` (application) and `ecomstore_test` (tests only); user `ecomstore` / password `ecomstore` |
| Docker init | `MYSQL_USER`/`MYSQL_PASSWORD` create the user; `docker/mysql/init/01-create-test-database.sql` creates `ecomstore_test` and grants the existing user access (no `CREATE USER`). Runs only on a fresh volume |
| Migrations | Flyway (`spring-boot-starter-flyway`, `flyway-mysql`); versioned SQL creates the schema and seeds 3 categories and 6 products. Applied migrations are never edited |
| API docs | springdoc-openapi 3.2.0 (built against Spring Boot 4.1.2); `/v3/api-docs`, `/swagger-ui/index.html` |
| CORS | `/api/**` allowed only from `http://localhost:5173` (GET, POST, OPTIONS, incl. preflight) |
| Errors | Spring `ProblemDetail`: 400 identifies invalid fields; 409 identifies each short-stock product with requested/available |

### Public API contract (all under `/api/v1`)

- `GET /categories` → `[{id, name}]`
- `GET /products?search=&categoryId=` → `[{id, name, description, price, stock, categoryId, categoryName}]`
- `POST /orders` — request `{customer:{fullName,email}, shippingAddress, items:[{productId,quantity}]}`; success **201** `{orderNumber, customer, shippingAddress, items:[{productId,productName,unitPrice,quantity,subtotal}], totalAmount, createdAt}`

JPA entities are never exposed; all payloads are records.

## Domain model and schema

Packages: `catalog` (categories, products, search), `order` (placing orders), `web` (error mapping), `config` (CORS).

| Table | Columns | Notes |
|---|---|---|
| `categories` | `id` PK, `name` unique | |
| `products` | `id` PK, `name`, `description`, `price DECIMAL(10,2)`, `stock INT`, `category_id` FK | CHECK `price > 0`, `stock >= 0` |
| `orders` | `id` PK, `order_number` unique, `customer_name`, `customer_email`, `shipping_address`, `total_amount DECIMAL(12,2)`, `created_at DATETIME(6)` (UTC) | no customer table — no accounts |
| `order_items` | `id` PK, `order_id` FK, `product_id` FK, `product_name`, `unit_price`, `quantity`, `subtotal` | CHECK `quantity > 0`; name and price are a snapshot at order time |

Hibernate runs with `ddl-auto=validate`; Flyway owns the schema.

## Services and behavior

- **CatalogService** (read-only transactions): lists categories; searches products. The search text is trimmed and matched with a case-insensitive `LOCATE` (a substring match with no `%`/`_` wildcard semantics); an empty search matches everything; `categoryId` is optional; both combine with AND. Results are ordered by id. An unknown `categoryId` yields an empty list.
- **OrderService.placeOrder** (one `@Transactional` method):
  1. Merge repeated `productId`s by summing quantities.
  2. Load the products; any unknown id → 400 on `items[i].productId`.
  3. For each product (ascending id) run the conditional update below. Prices come from the loaded products, never from the request.
  4. If any update affected 0 rows, collect a shortage (requested, and the current stock re-read from the database) and keep checking the rest so *every* short item is reported; then throw `InsufficientStockException`.
  5. Otherwise build the order (server-calculated subtotals and total, generated order number, UTC timestamp) and save it with its items.

### Stock strategy

```sql
UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty
```

(JPQL `@Modifying` query.) One statement checks and decrements atomically, so concurrent orders cannot oversell. `0` rows updated = insufficient stock. Any exception rolls back the whole transaction, undoing decrements already made for other items in the same order, so no partial order or stock change survives. Updating in ascending id order keeps lock ordering consistent between concurrent orders.

### Order number

`ORD-` + the first 16 hex characters of a random UUID, uppercase. Uniqueness is enforced by a unique constraint; there is deliberately no collision-retry logic.

## Validation (Bean Validation on `OrderRequest`)

`customer` required; `customer.fullName` not blank (≤200); `customer.email` not blank, well-formed (≤254); `shippingAddress` not blank (≤500); `items` not empty; each item needs `productId` and a positive integer `quantity`. Text values are trimmed before saving.

## Error format

400 (validation, unknown product, malformed JSON):

```json
{"title":"Invalid request","status":400,
 "detail":"Request validation failed","instance":"/api/v1/orders",
 "errors":[{"field":"customer.email","message":"must be a well-formed email address"}]}
```

409 (insufficient stock; no order, no stock change):

```json
{"title":"Insufficient stock","status":409,
 "detail":"Insufficient stock; no order was created and stock is unchanged","instance":"/api/v1/orders",
 "shortages":[{"productId":5,"productName":"Espresso Machine","requested":4,"available":3}]}
```

## Request / response example

Request `POST /api/v1/orders`:

```json
{"customer":{"fullName":"Ada Lovelace","email":"ada@example.com"},
 "shippingAddress":"1 Main St",
 "items":[{"productId":1,"quantity":2}]}
```

Response **201**:

```json
{"orderNumber":"ORD-7DA1E28EF9F54BE0",
 "customer":{"fullName":"Ada Lovelace","email":"ada@example.com"},
 "shippingAddress":"1 Main St",
 "items":[{"productId":1,"productName":"Wireless Headphones","unitPrice":129.99,"quantity":2,"subtotal":259.98}],
 "totalAmount":259.98,"createdAt":"2026-10-29T04:53:30.478213300Z"}
```

## Scope notes

- The cart (CART-*) and visual requirements are frontend concerns. Cart behaviors the backend supports: it accepts any positive quantity and checks stock only when the order is submitted (CART-008, CHK-005..007).
- `POST /orders` validation with `quantity` ≤ 0 returns 400 (CHK-004).
- No order lookup endpoint exists (out of scope); saved orders are inspected through SQL only.
- Tests run against `ecomstore_test`; before each test the order tables are emptied and seed stock is restored in that database only.
- The MySQL URL contains `allowPublicKeyRetrieval=true&useSSL=false`, which is only suitable for the local Docker database.

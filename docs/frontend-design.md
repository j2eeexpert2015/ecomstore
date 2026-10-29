# EcomStore Frontend Design

Implements the customer-facing parts of [requirements.md](requirements.md) on top of the backend described in [backend-design.md](backend-design.md). No backend change was made.

## Constraints

| Area | Decision |
|---|---|
| Stack | React 19, TypeScript, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`), React Router 7, npm |
| Location | `frontend/` |
| Ports | Frontend `http://localhost:5173` (fixed with `strictPort`, because the backend allows CORS only from this origin); backend `http://localhost:8080` |
| Environment | `VITE_API_BASE_URL` (template in `frontend/.env.example`; defaults to `http://localhost:8080` if unset) |
| Visual style | Navy header (`#0b1f3a`) with prominent search; amber Add to Cart buttons and cart count; light-gray page background; white rounded product cards; category pills under the header; dark footer; green/amber/red stock badges |
| Scope | Catalog, cart, checkout and confirmation only. No accounts, payments, order lookup/tracking, product-detail page, images, pagination or sorting |
| Packages | Only React, React Router, Vite, the React plugin, Tailwind and TypeScript (+ React type packages). No state, form or HTTP libraries; no linter is configured |

## Verified API (from live `/v3/api-docs`, OpenAPI 3.1.0, consistent with the backend design)

- `GET /api/v1/categories` → `[{id, name}]`
- `GET /api/v1/products?search=&categoryId=` (both optional) → `[{id, name, description, price, stock, categoryId, categoryName}]`
- `POST /api/v1/orders` `{customer:{fullName,email}, shippingAddress, items:[{productId,quantity}]}` → 201 `{orderNumber, customer, shippingAddress, items:[{productId,productName,unitPrice,quantity,subtotal}], totalAmount, createdAt}`
- Errors are not in the OpenAPI document (they come from the exception handler) and follow the backend design: 400 `{detail, errors:[{field,message}]}`, 409 `{detail, shortages:[{productId,productName,requested,available}]}`.

## Routes and pages

| Route | Page | Purpose |
|---|---|---|
| `/` | `CatalogPage` | Product cards, category pills, search results; filters live in the query string (`?search=&categoryId=`) |
| `/cart` | `CartPage` | Edit quantities, remove lines, subtotals and total |
| `/checkout` | `CheckoutPage` | Customer form, order summary, validation and stock-shortage messages |
| `/confirmation` | `ConfirmationPage` | Order confirmation from the POST response |
| anything else | — | Redirects to `/` |

## Component structure

```text
App.tsx                  routes
components/Layout.tsx    navy header (logo, search, cart count), <Outlet/>, dark footer
components/StockBadge    green "In stock" (>5), amber "Only N left" (1–5), red "Out of stock" (0)
components/Message       Notice box for loading / empty / error states
pages/*                  the four pages above
cart/CartContext.tsx     cart state + persistence
api.ts, types.ts         API client and response types
lastOrder.ts             in-memory holder for the confirmation
format.ts                USD formatting
```

## Search and filters

The header search box writes `search` into the URL, so it works from every page (typing on another page navigates to `/`). Category pills write `categoryId`. `CatalogPage` re-fetches `GET /products` whenever either changes and aborts the previous request. Trimming and case-insensitive matching are done by the backend. "Clear filters" resets both.

## Cart state

`CartContext` (`useReducer`) holds lines `{productId, name, price, quantity}`.

- `add`: new line with quantity 1, or +1 if already present.
- `setQuantity`, `remove`, `clear`.
- Quantities are **not** capped at stock, and lines are never removed or changed because of stock.
- Persisted to `localStorage` key `ecomstore.cart` on every change and loaded on start (reading/writing errors are ignored).
- Header count = sum of quantities; total = sum of price × quantity (computed in cents to avoid float drift).
- On start the provider fetches the product list once and refreshes each line's displayed name and price only (quantities untouched), so the cart total matches what the server will charge. The order request itself never contains prices.
- The quantity field accepts only whole numbers ≥ 1 (up to 6 digits). Anything else shows an inline message and leaves the stored quantity unchanged; leaving the field restores the stored value.

## API client

`api.ts` wraps `fetch` against `${VITE_API_BASE_URL}/api/v1`. A non-2xx response becomes an `ApiError` carrying `status`, `errors[]` and `shortages[]` parsed from the ProblemDetail body.

## Checkout, validation and errors

- Client-side checks before sending: full name required, email required and well-formed, shipping address required. Errors appear under each field.
- The cart items are sent as `{productId, quantity}`; an empty cart shows an "empty cart" notice instead of the form.
- **400**: field errors are mapped back onto the form fields (`customer.fullName` → full name, `customer.email` → email, `shippingAddress`); any other problems are shown in an alert.
- **409**: an alert lists each product as "*name*: requested *X*, available *Y*", states that the order was not placed and the cart is unchanged, and links to the cart. The form values and cart are kept.
- **Network/other**: a general "could not be sent" alert; cart kept.
- **Success (201)**: the cart is cleared only now, the response is stored in memory (`lastOrder.ts`) and the app navigates to `/confirmation`.

## Confirmation

Shows the order number, date/time, customer, address, each item with price, quantity and subtotal, and the total — all from the POST response. It is held in memory only: a refresh (or opening `/confirmation` directly) redirects to `/`. There is deliberately no order lookup or history.

## Loading, empty and error states

Catalog: "Loading products…", "No products found." (with Clear filters when filters are active), and an error notice with a Retry button when the backend cannot be reached. Cart and checkout: empty-cart notices with a link back to the catalog.

## Responsive design

Tailwind breakpoints: product grid 1 column on phones, 2 from `sm`, 3 from `lg`; the header wraps so the search box takes its own full-width row on narrow screens; category pills scroll horizontally; cart rows wrap; checkout is a single column on small screens and form + summary side by side from `md`.

## Differences from the requirements document / notes

- Search matching and trimming are performed by the backend, not duplicated in the browser.
- The cart-price refresh and the "Stock: N" line on cards are small conveniences consistent with CAT-001/CHK-008; they add no new feature.
- The frontend has no automated tests (none were requested); verification is a type-check, a production build and a manual UI test (see README section 9).

# EcomStore — Functional Requirements

EcomStore is a single-catalog online store. Customers browse products, fill a shopping cart, and check out without logging in.

This document describes **what** the system does. IDs are stable and never reused.

---

## Catalog

**CAT-001** — The system SHALL display a single catalog of products showing, for each product, its name, description, category, price, and stock quantity.
- WHEN a customer opens the store THEN every product in the catalog is shown with name, description, category, price, and stock quantity.

**CAT-002** — The system SHALL allow filtering the catalog by product name using case-insensitive substring matching after trimming leading and trailing spaces from the search text.
- WHEN a customer searches for `  KEYboard  ` THEN "Mechanical Keyboard" is shown and products whose names do not contain "keyboard" are not.
- WHEN the search text is empty or only spaces THEN no name filter is applied.

**CAT-003** — The system SHALL allow filtering the catalog by category.
- WHEN a customer selects the category "Books" THEN only Books products are shown.
- WHEN no category is selected THEN products from all categories are shown.

**CAT-004** — The system SHALL apply the name search and category filter together when both are set, and either one SHALL be optional.
- WHEN a customer selects "Electronics" and searches "key" THEN only "Mechanical Keyboard" is shown.
- WHEN a customer selects "Books" and searches "headphones" THEN no products are shown and a "no products found" message is displayed.

**CAT-005** — The system SHALL let a customer add a product to the shopping cart directly from the catalog, without a separate product-detail page.
- WHEN a customer activates Add to Cart on a product with stock above 0 THEN the product is added to the cart.

**CAT-006** — The system SHALL NOT allow a product with zero stock to be added to the cart from the catalog.
- WHEN a product has stock 0 THEN its Add to Cart control is disabled and activating it does not change the cart.

---

## Cart

**CART-001** — The system SHALL add a product to the cart with quantity 1 when it is not already in the cart.
- WHEN an empty cart receives "Clean Code" THEN the cart contains one line for "Clean Code" with quantity 1.

**CART-002** — The system SHALL increase a cart line's quantity by one when the same product is added again.
- WHEN "Clean Code" is in the cart with quantity 1 AND the customer adds it again THEN its quantity is 2 and the cart still has one line for it.

**CART-003** — The system SHALL let the customer change a cart line's quantity to any positive integer.
- WHEN the customer sets a line's quantity to 4 THEN the line shows quantity 4 and its subtotal and the cart total update.
- WHEN the customer enters zero, a negative number, a fraction, or non-numeric text THEN the entry is rejected with a clear message and the quantity is unchanged.

**CART-004** — The system SHALL let the customer remove a product from the cart.
- WHEN the customer removes a line THEN that product no longer appears and the cart total updates.
- WHEN the last line is removed THEN an empty-cart message is shown.

**CART-005** — The system SHALL show each line's subtotal (price × quantity) and the cart total (sum of line subtotals).
- WHEN the cart holds 2 × Water Bottle ($24.99) and 1 × Clean Code ($34.95) THEN the subtotals are $49.98 and $34.95 and the total is $84.93.

**CART-006** — The system SHALL preserve the cart contents when the page is refreshed.
- WHEN a customer has items in the cart AND refreshes the page THEN the same products and quantities are in the cart.

**CART-007** — The system SHALL show the total number of units in the cart (sum of all line quantities) in the header cart count.
- WHEN the cart holds 2 × Water Bottle and 1 × Clean Code THEN the header cart count shows 3.
- WHEN the cart is empty THEN the header cart count shows 0.

**CART-008** — The system SHALL allow a customer to set a cart quantity greater than the stock currently available, and SHALL NOT check stock until an order is submitted at checkout.
- WHEN "Espresso Machine" has stock 3 AND the customer sets its cart quantity to 5 THEN the cart accepts quantity 5 without a stock error.

**CART-009** — The system SHALL keep a cart item whose product has become unavailable, unchanged in the cart, until checkout reports the shortage.
- WHEN a product in the cart later has less stock than the cart quantity, or zero stock, THEN the item remains in the cart with its quantity unchanged and is not silently removed.

**CART-010** — The system SHALL NOT require login or an account to use the catalog, cart, or checkout.
- WHEN a first-time visitor browses, adds to the cart, and checks out THEN no sign-in or registration is requested.

---

## Checkout

**CHK-001** — The system SHALL collect the customer's full name, email address, and shipping address at checkout, and all three SHALL be required.
- WHEN any of the three is missing or only spaces THEN the order is rejected with a message naming the missing field.

**CHK-002** — The system SHALL reject an email address that is not a valid email format.
- WHEN the email is `not-an-email` THEN the order is rejected with a message that the email address is invalid.

**CHK-003** — The system SHALL require at least one order item.
- WHEN checkout is attempted with an empty cart THEN the order is rejected with a message that at least one item is required.

**CHK-004** — The system SHALL reject any order item whose quantity is not a positive integer, with a message identifying the problem.
- WHEN an order item has quantity 0 or a negative quantity THEN the order is rejected with a message identifying that item and its invalid quantity.

**CHK-005** — The system SHALL validate available stock for every ordered item when the order is submitted.
- WHEN every requested quantity is less than or equal to the stock available THEN stock validation passes.

**CHK-006** — The system SHALL, when any requested quantity exceeds available stock, reject the order and identify each affected item with its requested and available quantities.
- WHEN a customer orders 5 × Espresso Machine and only 3 are in stock THEN the order is rejected with a message such as "Espresso Machine: requested 5, available 3".
- WHEN several items are short THEN every short item is identified.

**CHK-007** — The system SHALL NOT create a partial order or change any stock when an order fails for any reason.
- WHEN an order with one available item and one short item is submitted THEN no order is created and the stock of both items is unchanged.

**CHK-008** — The system SHALL use the current product prices held by the store, not prices supplied with the cart, to price an order, and SHALL calculate the order total as the sum of (current price × quantity) over all items.
- WHEN the cart was built at an earlier price THEN the order uses the store's current price.
- WHEN a valid order has 1 × Wireless Headphones ($129.99) and 2 × Water Bottle ($24.99) THEN the total is $179.97.

**CHK-009** — The system SHALL, on a successful order, save the order and its items and reduce each ordered product's stock by the ordered quantity.
- WHEN an order for 2 × Clean Code (stock 20) succeeds THEN the Clean Code stock becomes 18.

**CHK-010** — The system SHALL, on success, show an order confirmation with a unique order number, the ordered items, their quantities, item subtotals, the order total, and the order date and time.
- WHEN an order succeeds THEN the confirmation shows all of the above.
- WHEN two orders succeed THEN their order numbers differ.

**CHK-011** — The system SHALL clear the cart only after the order is confirmed as successful.
- WHEN an order succeeds THEN the cart is empty and the header cart count shows 0.
- WHEN an order fails for any reason THEN the cart contents and the customer's entered details are retained so the customer can correct and retry.

---

## Sample data

The store starts with exactly these six products:

| Category | Name | Price | Stock | Description |
|---|---|---|---|---|
| Electronics | Wireless Headphones | $129.99 | 10 | Comfortable over-ear headphones for everyday listening. |
| Electronics | Mechanical Keyboard | $89.50 | 15 | Compact mechanical keyboard with tactile switches. |
| Books | Clean Code | $34.95 | 20 | A practical book about writing maintainable software. |
| Books | Spring Boot in Practice | $44.00 | 10 | Hands-on guidance for building Spring Boot applications. |
| Home & Kitchen | Espresso Machine | $249.99 | 3 | Countertop espresso maker for home coffee brewing. |
| Home & Kitchen | Water Bottle | $24.99 | 25 | Reusable insulated bottle for daily use. |

---

## Visual expectations

A simple, responsive EcomStore interface with:

- A navy header containing a prominent search and the cart count.
- Amber Add to Cart buttons and amber cart count.
- A light-gray page background and white, rounded product cards.
- Category-filter pills under the header.
- A dark footer.
- Prices shown in USD with two decimal places (for example `$129.99`, `$44.00`).

**Availability badge** on every product card:

| Stock | Badge |
|---|---|
| Above 5 | Green "In stock" |
| 1–5 | Amber "Only N left" (N = stock) |
| 0 | Red "Out of stock", with Add to Cart disabled |

**States:** the interface SHALL show clear loading, empty, and error states, including a loading indicator while the catalog loads, a "no products found" message when filters match nothing, an empty-cart message, and an understandable error message when the catalog cannot be loaded or an order fails.

---

## Out of scope

Payments, accounts, product detail pages, product images, pagination, sorting, order tracking or lookup, cancellation, refunds, order status workflow, admin features, coupons, email sending, deployment, and production-scale concurrency or load testing.

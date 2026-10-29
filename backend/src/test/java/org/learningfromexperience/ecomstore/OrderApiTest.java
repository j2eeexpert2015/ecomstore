package org.learningfromexperience.ecomstore;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

class OrderApiTest extends AbstractApiTest {

    private ResultActions postOrder(String json) throws Exception {
        return mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private String order(String fullName, String email, String address, String items) {
        return """
                {"customer":{"fullName":"%s","email":"%s"},"shippingAddress":"%s","items":%s}
                """.formatted(fullName, email, address, items);
    }

    private String item(long productId, int quantity) {
        return "{\"productId\":%d,\"quantity\":%d}".formatted(productId, quantity);
    }

    @Test
    @DisplayName("CHK-010: a valid order returns 201 with order number, items, subtotals, total and date/time")
    void validOrderReturnsConfirmation() throws Exception {
        long headphones = productId("Wireless Headphones");
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St", "[" + item(headphones, 2) + "]"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.customer.fullName").value("Ada Lovelace"))
                .andExpect(jsonPath("$.customer.email").value("ada@example.com"))
                .andExpect(jsonPath("$.shippingAddress").value("1 Main St"))
                .andExpect(jsonPath("$.items[0].productId").value(headphones))
                .andExpect(jsonPath("$.items[0].productName").value("Wireless Headphones"))
                .andExpect(jsonPath("$.items[0].unitPrice").value(129.99))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.items[0].subtotal").value(259.98))
                .andExpect(jsonPath("$.totalAmount").value(259.98))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    @DisplayName("CHK-008: the order total is the sum of server-side price times quantity over all items")
    void totalUsesServerPrices() throws Exception {
        long headphones = productId("Wireless Headphones");
        long bottle = productId("Water Bottle");
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St",
                "[" + item(headphones, 1) + "," + item(bottle, 2) + "]"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalAmount").value(179.97));
    }

    @Test
    @DisplayName("CHK-009: a successful order is saved and reduces stock by the ordered quantity")
    void successfulOrderSavesAndReducesStock() throws Exception {
        long headphones = productId("Wireless Headphones");
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St", "[" + item(headphones, 2) + "]"))
                .andExpect(status().isCreated());

        assertThat(stockOf("Wireless Headphones")).isEqualTo(8);
        assertThat(orderCount()).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from order_items", Integer.class)).isEqualTo(1);
    }

    @Test
    @DisplayName("CHK-010: two successful orders receive different order numbers")
    void orderNumbersAreUnique() throws Exception {
        long bottle = productId("Water Bottle");
        String body = order("Ada Lovelace", "ada@example.com", "1 Main St", "[" + item(bottle, 1) + "]");
        postOrder(body).andExpect(status().isCreated());
        postOrder(body).andExpect(status().isCreated());

        assertThat(jdbc.queryForObject("select count(distinct order_number) from orders", Integer.class)).isEqualTo(2);
    }

    @Test
    @DisplayName("CHK-001: a blank full name is rejected with 400 naming customer.fullName and nothing is saved")
    void blankFullNameRejected() throws Exception {
        long bottle = productId("Water Bottle");
        postOrder(order("  ", "ada@example.com", "1 Main St", "[" + item(bottle, 1) + "]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("customer.fullName")));
        assertThat(orderCount()).isZero();
    }

    @Test
    @DisplayName("CHK-001: a missing shipping address is rejected with 400 naming shippingAddress")
    void missingShippingAddressRejected() throws Exception {
        long bottle = productId("Water Bottle");
        postOrder("""
                {"customer":{"fullName":"Ada Lovelace","email":"ada@example.com"},"items":[%s]}
                """.formatted(item(bottle, 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("shippingAddress")));
    }

    @Test
    @DisplayName("CHK-002: an invalid email is rejected with 400 naming customer.email")
    void invalidEmailRejected() throws Exception {
        long bottle = productId("Water Bottle");
        postOrder(order("Ada Lovelace", "not-an-email", "1 Main St", "[" + item(bottle, 1) + "]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("customer.email")));
        assertThat(orderCount()).isZero();
    }

    @Test
    @DisplayName("CHK-003: an order with no items is rejected with 400 naming items")
    void emptyItemsRejected() throws Exception {
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St", "[]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("items")));
    }

    @Test
    @DisplayName("CHK-004: zero and negative quantities are rejected with 400 identifying the item quantity")
    void nonPositiveQuantityRejected() throws Exception {
        long bottle = productId("Water Bottle");
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St", "[" + item(bottle, 0) + "]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("items[0].quantity")));
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St", "[" + item(bottle, -2) + "]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("items[0].quantity")));
        assertThat(stockOf("Water Bottle")).isEqualTo(25);
    }

    @Test
    @DisplayName("CHK-005: an order for exactly the available stock is accepted and leaves zero stock")
    void orderForAllAvailableStockSucceeds() throws Exception {
        long espresso = productId("Espresso Machine");
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St", "[" + item(espresso, 3) + "]"))
                .andExpect(status().isCreated());
        assertThat(stockOf("Espresso Machine")).isZero();
    }

    @Test
    @DisplayName("CHK-006: insufficient stock returns 409 with the product, requested and available quantities")
    void insufficientStockReported() throws Exception {
        long espresso = productId("Espresso Machine");
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St", "[" + item(espresso, 4) + "]"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.shortages.length()").value(1))
                .andExpect(jsonPath("$.shortages[0].productId").value(espresso))
                .andExpect(jsonPath("$.shortages[0].productName").value("Espresso Machine"))
                .andExpect(jsonPath("$.shortages[0].requested").value(4))
                .andExpect(jsonPath("$.shortages[0].available").value(3));
    }

    @Test
    @DisplayName("CHK-007: when one item is short, no order is created and no stock changes for any item")
    void shortageRollsBackWholeOrder() throws Exception {
        long headphones = productId("Wireless Headphones");
        long espresso = productId("Espresso Machine");
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St",
                "[" + item(headphones, 2) + "," + item(espresso, 4) + "]"))
                .andExpect(status().isConflict());

        assertThat(orderCount()).isZero();
        assertThat(jdbc.queryForObject("select count(*) from order_items", Integer.class)).isZero();
        assertThat(stockOf("Wireless Headphones")).isEqualTo(10);
        assertThat(stockOf("Espresso Machine")).isEqualTo(3);
    }

    @Test
    @DisplayName("CHK-006: every short item is identified when several items are short")
    void allShortagesIdentified() throws Exception {
        long espresso = productId("Espresso Machine");
        long headphones = productId("Wireless Headphones");
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St",
                "[" + item(espresso, 5) + "," + item(headphones, 11) + "]"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.shortages.length()").value(2));
    }

    @Test
    @DisplayName("CHK-004: an unknown product id is rejected with 400 naming the item and nothing changes")
    void unknownProductRejected() throws Exception {
        postOrder(order("Ada Lovelace", "ada@example.com", "1 Main St", "[" + item(999999, 1) + "]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("items[0].productId")));
        assertThat(orderCount()).isZero();
    }
}

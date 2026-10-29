package org.learningfromexperience.ecomstore.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(String orderNumber, CustomerResponse customer, String shippingAddress,
                            List<OrderItemResponse> items, BigDecimal totalAmount, Instant createdAt) {

    public record CustomerResponse(String fullName, String email) {
    }

    public record OrderItemResponse(Long productId, String productName, BigDecimal unitPrice, int quantity,
                                    BigDecimal subtotal) {
    }

    static OrderResponse from(Order o) {
        return new OrderResponse(o.getOrderNumber(),
                new CustomerResponse(o.getCustomerName(), o.getCustomerEmail()),
                o.getShippingAddress(),
                o.getItems().stream()
                        .map(i -> new OrderItemResponse(i.getProductId(), i.getProductName(), i.getUnitPrice(),
                                i.getQuantity(), i.getSubtotal()))
                        .toList(),
                o.getTotalAmount(), o.getCreatedAt());
    }
}

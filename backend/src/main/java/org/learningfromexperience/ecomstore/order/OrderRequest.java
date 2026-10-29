package org.learningfromexperience.ecomstore.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record OrderRequest(
        @NotNull @Valid CustomerRequest customer,
        @NotBlank @Size(max = 500) String shippingAddress,
        @NotEmpty List<@NotNull @Valid OrderItemRequest> items) {

    public record CustomerRequest(
            @NotBlank @Size(max = 200) String fullName,
            @NotBlank @Email @Size(max = 254) String email) {
    }

    public record OrderItemRequest(
            @NotNull Long productId,
            @NotNull @Positive Integer quantity) {
    }
}

package org.learningfromexperience.ecomstore.catalog;

import java.math.BigDecimal;

public record ProductResponse(Long id, String name, String description, BigDecimal price, int stock,
                              Long categoryId, String categoryName) {

    static ProductResponse from(Product p) {
        return new ProductResponse(p.getId(), p.getName(), p.getDescription(), p.getPrice(), p.getStock(),
                p.getCategory().getId(), p.getCategory().getName());
    }
}

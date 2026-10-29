package org.learningfromexperience.ecomstore.order;

import java.util.List;

public class InsufficientStockException extends RuntimeException {

    public record Shortage(Long productId, String productName, int requested, int available) {
    }

    private final transient List<Shortage> shortages;

    public InsufficientStockException(List<Shortage> shortages) {
        super("Insufficient stock for " + shortages.size() + " product(s)");
        this.shortages = shortages;
    }

    public List<Shortage> getShortages() {
        return shortages;
    }
}

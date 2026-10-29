package org.learningfromexperience.ecomstore.order;

import org.learningfromexperience.ecomstore.catalog.Product;
import org.learningfromexperience.ecomstore.catalog.ProductRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final ProductRepository products;
    private final OrderRepository orders;

    public OrderService(ProductRepository products, OrderRepository orders) {
        this.products = products;
        this.orders = orders;
    }

    /**
     * All-or-nothing: any exception (shortage, unknown product, database error) rolls back
     * every stock decrement and the order itself.
     */
    @Transactional
    public OrderResponse placeOrder(OrderRequest request) {
        // Merge repeated products; TreeMap gives a stable update order (by product id).
        Map<Long, Integer> requested = new TreeMap<>();
        for (OrderRequest.OrderItemRequest item : request.items()) {
            requested.merge(item.productId(), item.quantity(), Math::addExact);
        }

        Map<Long, Product> found = products.findAllWithCategoryByIdIn(requested.keySet()).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        for (int i = 0; i < request.items().size(); i++) {
            if (!found.containsKey(request.items().get(i).productId())) {
                throw new InvalidOrderException("items[" + i + "].productId", "Product does not exist");
            }
        }

        List<InsufficientStockException.Shortage> shortages = new ArrayList<>();
        for (Map.Entry<Long, Integer> e : requested.entrySet()) {
            if (products.decrementStockIfAvailable(e.getKey(), e.getValue()) == 0) {
                Product p = found.get(e.getKey());
                shortages.add(new InsufficientStockException.Shortage(p.getId(), p.getName(), e.getValue(),
                        products.currentStock(p.getId())));
            }
        }
        if (!shortages.isEmpty()) {
            throw new InsufficientStockException(shortages);
        }

        Order order = new Order("ORD-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase(),
                request.customer().fullName().trim(), request.customer().email().trim(),
                request.shippingAddress().trim(), Instant.now());
        requested.forEach((id, qty) -> {
            Product p = found.get(id);
            order.addItem(p.getId(), p.getName(), p.getPrice(), qty);
        });
        return OrderResponse.from(orders.save(order));
    }
}

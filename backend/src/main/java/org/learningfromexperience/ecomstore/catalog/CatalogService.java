package org.learningfromexperience.ecomstore.catalog;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CatalogService {

    private final CategoryRepository categories;
    private final ProductRepository products;

    public CatalogService(CategoryRepository categories, ProductRepository products) {
        this.categories = categories;
        this.products = products;
    }

    public List<CategoryResponse> listCategories() {
        return categories.findAllByOrderByIdAsc().stream()
                .map(c -> new CategoryResponse(c.getId(), c.getName()))
                .toList();
    }

    public List<ProductResponse> searchProducts(String search, Long categoryId) {
        String term = search == null ? "" : search.trim();
        return products.search(term, categoryId).stream().map(ProductResponse::from).toList();
    }
}

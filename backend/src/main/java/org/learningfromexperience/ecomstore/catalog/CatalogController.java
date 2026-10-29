package org.learningfromexperience.ecomstore.catalog;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @Tag(name = "Categories")
    @Operation(summary = "List all categories")
    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return catalog.listCategories();
    }

    @Tag(name = "Products")
    @Operation(summary = "List products, optionally filtered by name search and/or category")
    @GetMapping("/products")
    public List<ProductResponse> products(@RequestParam(required = false) String search,
                                          @RequestParam(required = false) Long categoryId) {
        return catalog.searchProducts(search, categoryId);
    }
}

package org.learningfromexperience.ecomstore;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CatalogApiTest extends AbstractApiTest {

    @Test
    @DisplayName("CAT-001: lists all six products with name, description, category, price and stock")
    void listsAllProducts() throws Exception {
        mvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[0].name").value("Wireless Headphones"))
                .andExpect(jsonPath("$[0].description").value("Comfortable over-ear headphones for everyday listening."))
                .andExpect(jsonPath("$[0].price").value(129.99))
                .andExpect(jsonPath("$[0].stock").value(10))
                .andExpect(jsonPath("$[0].categoryName").value("Electronics"))
                .andExpect(jsonPath("$[4].name").value("Espresso Machine"))
                .andExpect(jsonPath("$[4].stock").value(3));
    }

    @Test
    @DisplayName("CAT-003: lists the three categories")
    void listsCategories() throws Exception {
        mvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].name").value("Electronics"))
                .andExpect(jsonPath("$[1].name").value("Books"))
                .andExpect(jsonPath("$[2].name").value("Home & Kitchen"));
    }

    @Test
    @DisplayName("CAT-002: search ignores case and surrounding spaces and matches substrings of the name")
    void searchIsCaseInsensitiveAndTrimmed() throws Exception {
        mvc.perform(get("/api/v1/products").param("search", "  KEYboard  "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Mechanical Keyboard"));
    }

    @Test
    @DisplayName("CAT-002: a blank search applies no name filter")
    void blankSearchReturnsEverything() throws Exception {
        mvc.perform(get("/api/v1/products").param("search", "   "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6));
    }

    @Test
    @DisplayName("CAT-003: filtering by category returns only that category's products")
    void filtersByCategory() throws Exception {
        Long booksId = jdbc.queryForObject("select id from categories where name = 'Books'", Long.class);
        mvc.perform(get("/api/v1/products").param("categoryId", String.valueOf(booksId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].categoryName").value("Books"))
                .andExpect(jsonPath("$[1].categoryName").value("Books"));
    }

    @Test
    @DisplayName("CAT-004: search and category filter work together")
    void searchAndCategoryCombine() throws Exception {
        Long electronicsId = jdbc.queryForObject("select id from categories where name = 'Electronics'", Long.class);
        mvc.perform(get("/api/v1/products").param("search", "key").param("categoryId", String.valueOf(electronicsId)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Mechanical Keyboard"));
    }

    @Test
    @DisplayName("CAT-004: a search and category with no matching product return an empty list")
    void combinedFilterWithNoMatch() throws Exception {
        Long booksId = jdbc.queryForObject("select id from categories where name = 'Books'", Long.class);
        mvc.perform(get("/api/v1/products").param("search", "headphones").param("categoryId", String.valueOf(booksId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}

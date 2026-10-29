package org.learningfromexperience.ecomstore;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Runs against the isolated ecomstore_test database (Flyway migrates it on startup).
 * Orders are removed and seed stock restored before every test so tests are independent.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class AbstractApiTest {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JdbcTemplate jdbc;

    @BeforeEach
    void resetTestDatabase() {
        jdbc.update("delete from order_items");
        jdbc.update("delete from orders");
        jdbc.update("update products set stock = 10 where name = 'Wireless Headphones'");
        jdbc.update("update products set stock = 15 where name = 'Mechanical Keyboard'");
        jdbc.update("update products set stock = 20 where name = 'Clean Code'");
        jdbc.update("update products set stock = 10 where name = 'Spring Boot in Practice'");
        jdbc.update("update products set stock = 3 where name = 'Espresso Machine'");
        jdbc.update("update products set stock = 25 where name = 'Water Bottle'");
    }

    protected long productId(String name) {
        return jdbc.queryForObject("select id from products where name = ?", Long.class, name);
    }

    protected int stockOf(String name) {
        return jdbc.queryForObject("select stock from products where name = ?", Integer.class, name);
    }

    protected int orderCount() {
        return jdbc.queryForObject("select count(*) from orders", Integer.class);
    }
}

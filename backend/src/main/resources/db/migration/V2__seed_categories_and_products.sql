INSERT INTO categories (name) VALUES ('Electronics'), ('Books'), ('Home & Kitchen');

INSERT INTO products (name, description, price, stock, category_id) VALUES
 ('Wireless Headphones', 'Comfortable over-ear headphones for everyday listening.', 129.99, 10, (SELECT id FROM categories WHERE name = 'Electronics')),
 ('Mechanical Keyboard', 'Compact mechanical keyboard with tactile switches.', 89.50, 15, (SELECT id FROM categories WHERE name = 'Electronics')),
 ('Clean Code', 'A practical book about writing maintainable software.', 34.95, 20, (SELECT id FROM categories WHERE name = 'Books')),
 ('Spring Boot in Practice', 'Hands-on guidance for building Spring Boot applications.', 44.00, 10, (SELECT id FROM categories WHERE name = 'Books')),
 ('Espresso Machine', 'Countertop espresso maker for home coffee brewing.', 249.99, 3, (SELECT id FROM categories WHERE name = 'Home & Kitchen')),
 ('Water Bottle', 'Reusable insulated bottle for daily use.', 24.99, 25, (SELECT id FROM categories WHERE name = 'Home & Kitchen'));

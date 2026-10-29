-- Runs once, only when the MySQL data volume is empty (fresh volume).
-- The ecomstore user is created by Docker from MYSQL_USER / MYSQL_PASSWORD.
CREATE DATABASE IF NOT EXISTS ecomstore_test;
GRANT ALL PRIVILEGES ON ecomstore_test.* TO 'ecomstore'@'%';
FLUSH PRIVILEGES;

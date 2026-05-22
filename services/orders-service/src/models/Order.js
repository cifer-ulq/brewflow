// Order + OrderItem models — raw SQL via pg pool
// Table: orders (id, cashier_id, branch, total_amount, status, created_at)
// Table: order_items (id, order_id, item_id, item_name, quantity, unit_price)

const pool = require('../db');

const createOrdersTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id           SERIAL PRIMARY KEY,
      cashier_id   INTEGER NOT NULL,
      branch       VARCHAR(100),
      total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      status       VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id          SERIAL PRIMARY KEY,
      order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      item_id     INTEGER NOT NULL,
      item_name   VARCHAR(150) NOT NULL,
      quantity    NUMERIC(10,2) NOT NULL,
      unit_price  NUMERIC(10,2) NOT NULL
    )
  `);
};

module.exports = { createOrdersTables };

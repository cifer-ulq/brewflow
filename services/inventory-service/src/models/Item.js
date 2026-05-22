// Item model — raw SQL via pg pool
// Table: items (id, name, category, quantity, unit, reorder_level, cost_price, created_at)

const pool = require('../db');

const createItemsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(150) NOT NULL,
      category      VARCHAR(100),
      quantity      NUMERIC(10,2) NOT NULL DEFAULT 0,
      unit          VARCHAR(30) NOT NULL DEFAULT 'pcs',
      reorder_level NUMERIC(10,2) NOT NULL DEFAULT 10,
      cost_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

module.exports = { createItemsTable };

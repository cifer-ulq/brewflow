// Invoice model — raw SQL via pg pool
// Table: invoices (id, order_id, amount, tax, total, status, issued_at)

const pool = require('../db');

const createInvoicesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id         SERIAL PRIMARY KEY,
      order_id   INTEGER NOT NULL,
      amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
      tax        NUMERIC(10,2) NOT NULL DEFAULT 0,
      total      NUMERIC(10,2) NOT NULL DEFAULT 0,
      status     VARCHAR(30) NOT NULL DEFAULT 'paid',
      issued_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

module.exports = { createInvoicesTable };

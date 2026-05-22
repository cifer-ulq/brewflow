// Employee model — raw SQL via pg pool
// Table: employees (id, name, email, position, department, branch, salary, hired_at, status)

const pool = require('../db');

const createEmployeesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(150) NOT NULL,
      email       VARCHAR(150) UNIQUE NOT NULL,
      position    VARCHAR(100),
      department  VARCHAR(100),
      branch      VARCHAR(100),
      salary      NUMERIC(10,2) NOT NULL DEFAULT 0,
      hired_at    DATE,
      status      VARCHAR(30) NOT NULL DEFAULT 'active',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

module.exports = { createEmployeesTable };

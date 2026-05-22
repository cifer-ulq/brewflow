// User model — raw SQL via pg pool
// Table: users (id, name, email, password_hash, role, created_at)

const pool = require('../db');
const bcrypt = require('bcryptjs');

const createUsersTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      name      VARCHAR(100) NOT NULL,
      email     VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role      VARCHAR(50) NOT NULL DEFAULT 'staff',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

const seedUsers = async () => {
  const seeds = [
    { name: 'Admin',           email: 'admin@brewflow.com',   password: 'admin123',   role: 'admin' },
    { name: 'Cashier',         email: 'cashier@brewflow.com', password: 'cashier123', role: 'cashier' },
    { name: 'Finance Officer', email: 'finance@brewflow.com', password: 'finance123', role: 'finance_officer' },
  ];

  for (const user of seeds) {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
    if (exists.rows.length === 0) {
      const hash = await bcrypt.hash(user.password, 10);
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [user.name, user.email, hash, user.role]
      );
      console.log(`Seeded user: ${user.email} (${user.role})`);
    }
  }
};

module.exports = { createUsersTable, seedUsers };

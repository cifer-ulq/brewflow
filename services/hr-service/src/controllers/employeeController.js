const pool = require('../db');

exports.getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM employees WHERE status != 'deleted' ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employees WHERE id=$1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, position, department, branch, salary, hired_at } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO employees (name, email, position, department, branch, salary, hired_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, email, position || null, department || null, branch || null, salary || 0, hired_at || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { name, email, position, department, branch, salary, hired_at, status } = req.body;
    const result = await pool.query(
      `UPDATE employees
       SET name=$1, email=$2, position=$3, department=$4, branch=$5, salary=$6, hired_at=$7, status=$8
       WHERE id=$9
       RETURNING *`,
      [name, email, position, department, branch, salary, hired_at, status || 'active', req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    // Soft delete
    const result = await pool.query(
      "UPDATE employees SET status='deleted' WHERE id=$1 RETURNING id",
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

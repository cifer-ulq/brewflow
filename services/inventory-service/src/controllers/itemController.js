const pool = require('../db');

exports.getAllItems = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { name, category, quantity, unit, reorder_level, cost_price } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const result = await pool.query(
      `INSERT INTO items (name, category, quantity, unit, reorder_level, cost_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, category || null, quantity || 0, unit || 'pcs', reorder_level || 10, cost_price || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { name, category, quantity, unit, reorder_level, cost_price } = req.body;
    const result = await pool.query(
      `UPDATE items
       SET name=$1, category=$2, quantity=$3, unit=$4, reorder_level=$5, cost_price=$6
       WHERE id=$7
       RETURNING *`,
      [name, category, quantity, unit, reorder_level, cost_price, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM items WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deductStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'quantity must be a positive number' });
    }

    const check = await pool.query('SELECT quantity FROM items WHERE id=$1', [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ message: 'Item not found' });

    if (Number(check.rows[0].quantity) < quantity) {
      return res.status(409).json({ message: 'Insufficient stock' });
    }

    const result = await pool.query(
      'UPDATE items SET quantity = quantity - $1 WHERE id=$2 RETURNING *',
      [quantity, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

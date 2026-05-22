const pool = require('../db');
const axios = require('axios');

exports.getAllOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!order.rows[0]) return res.status(404).json({ message: 'Order not found' });

    const items = await pool.query(
      'SELECT * FROM order_items WHERE order_id=$1',
      [req.params.id]
    );
    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { branch, items } = req.body;
    // items: [{ item_id, item_name, quantity, unit_price }]

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'items array is required' });
    }

    const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (cashier_id, branch, total_amount, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, branch || 'Main Branch', total, 'completed']
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.item_id, item.item_name, item.quantity, item.unit_price]
      );
    }

    await client.query('COMMIT');

    // ── Inter-service: deduct stock from inventory-service ────────
    for (const item of items) {
      await axios
        .patch(
          `${process.env.INVENTORY_SERVICE_URL}/api/v1/inventory/${item.item_id}/deduct`,
          { quantity: item.quantity },
          { headers: { Authorization: req.headers.authorization } }
        )
        .catch((err) => console.error('Inventory deduct error:', err.message));
    }

    // ── Inter-service: create invoice in finance-service ──────────
    const tax = Math.round(total * 0.12 * 100) / 100;
    const invoiceTotal = Math.round((total + tax) * 100) / 100;
    await axios
      .post(`${process.env.FINANCE_SERVICE_URL}/api/v1/finance/invoices`, {
        order_id: order.id,
        amount: total,
        tax,
        total: invoiceTotal,
      })
      .catch((err) => console.error('Finance invoice error:', err.message));

    res.status(201).json({ ...order, items });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }

    const result = await pool.query(
      'UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const daily = await pool.query(`
      SELECT DATE(created_at) AS date,
             COUNT(*) AS total_orders,
             SUM(total_amount) FILTER (WHERE status = 'completed') AS revenue,
             COUNT(*) FILTER (WHERE status = 'completed') AS completed,
             COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const byBranch = await pool.query(`
      SELECT branch,
             COUNT(*) AS total_orders,
             SUM(total_amount) FILTER (WHERE status = 'completed') AS revenue
      FROM orders
      GROUP BY branch
      ORDER BY revenue DESC
    `);

    const overall = await pool.query(`
      SELECT COUNT(*) AS total_orders,
             SUM(total_amount) FILTER (WHERE status = 'completed') AS total_revenue,
             COUNT(*) FILTER (WHERE status = 'completed') AS completed,
             COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
             COUNT(*) FILTER (WHERE status = 'pending') AS pending
      FROM orders
    `);

    res.json({ daily: daily.rows, byBranch: byBranch.rows, overall: overall.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

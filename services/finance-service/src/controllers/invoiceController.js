const pool = require('../db');

exports.getAllInvoices = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices ORDER BY issued_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const { order_id, amount, tax, total } = req.body;
    if (!order_id || total === undefined) {
      return res.status(400).json({ message: 'order_id and total are required' });
    }

    const result = await pool.query(
      `INSERT INTO invoices (order_id, amount, tax, total, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [order_id, amount || 0, tax || 0, total, 'paid']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['paid', 'pending', 'void'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
    }
    const result = await pool.query(
      'UPDATE invoices SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const daily = await pool.query(
      `SELECT DATE(issued_at) AS date, COUNT(*) AS total_invoices, SUM(total) AS revenue
       FROM invoices
       WHERE issued_at >= NOW() - INTERVAL '30 days'
         AND status = 'paid'
       GROUP BY DATE(issued_at)
       ORDER BY date DESC`
    );

    const overall = await pool.query(
      `SELECT COUNT(*) AS total_invoices, SUM(total) AS total_revenue
       FROM invoices
       WHERE status = 'paid'`
    );

    res.json({
      overall: overall.rows[0],
      daily: daily.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

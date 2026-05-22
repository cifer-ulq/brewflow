require('dotenv').config();
const express = require('express');
const cors = require('cors');
const invoiceRoutes = require('./routes/invoiceRoutes');
const { createInvoicesTable } = require('./models/Invoice');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'finance-service' }));
app.use('/api/v1/finance', invoiceRoutes);

const PORT = process.env.PORT || 3005;

async function start() {
  await createInvoicesTable();
  console.log('Database tables ready');
  app.listen(PORT, () => console.log(`finance-service running on port ${PORT}`));
}

start().catch(console.error);

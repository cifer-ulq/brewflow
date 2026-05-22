require('dotenv').config();
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');
const { createOrdersTables } = require('./models/Order');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'orders-service' }));
app.use('/api/v1/orders', orderRoutes);

const PORT = process.env.PORT || 3003;

async function start() {
  await createOrdersTables();
  console.log('Database tables ready');
  app.listen(PORT, () => console.log(`orders-service running on port ${PORT}`));
}

start().catch(console.error);

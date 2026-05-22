require('dotenv').config();
const express = require('express');
const cors = require('cors');
const itemRoutes = require('./routes/itemRoutes');
const { createItemsTable } = require('./models/Item');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'inventory-service' }));
app.use('/api/v1/inventory', itemRoutes);

const PORT = process.env.PORT || 3002;

async function start() {
  await createItemsTable();
  console.log('Database tables ready');
  app.listen(PORT, () => console.log(`inventory-service running on port ${PORT}`));
}

start().catch(console.error);

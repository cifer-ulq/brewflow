require('dotenv').config();
const express = require('express');
const cors = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');
const { createEmployeesTable } = require('./models/Employee');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'hr-service' }));
app.use('/api/v1/hr', employeeRoutes);

const PORT = process.env.PORT || 3004;

async function start() {
  await createEmployeesTable();
  console.log('Database tables ready');
  app.listen(PORT, () => console.log(`hr-service running on port ${PORT}`));
}

start().catch(console.error);

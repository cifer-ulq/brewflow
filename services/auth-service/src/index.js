require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { createUsersTable, seedUsers } = require('./models/User');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));
app.use('/api/v1/auth', authRoutes);

const PORT = process.env.PORT || 3001;

async function start() {
  await createUsersTable();
  await seedUsers();
  console.log('Database tables ready');
  app.listen(PORT, () => console.log(`auth-service running on port ${PORT}`));
}

start().catch(console.error);

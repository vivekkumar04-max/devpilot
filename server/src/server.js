
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import setupRoutes from './routes/setupRoutes.js';
import dotenv from 'dotenv';
import dns from 'dns'

//change dns
dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'devpilot-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/setup', setupRoutes);

const port = process.env.PORT || 5000;
try {
  await connectDB();
  app.listen(port, () => console.log(`DevPilot API listening on http://localhost:${port}`));
} catch (error) {
  console.error('Could not start API:', error.message);
  process.exit(1);
}

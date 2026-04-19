import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import caseRoutes from './routes/caseRoutes';
import userRoutes from './routes/userRoutes';

import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { prisma } from '../infrastructure/prisma';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      database: 'Connected', 
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ status: 'FAIL', error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler as any);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

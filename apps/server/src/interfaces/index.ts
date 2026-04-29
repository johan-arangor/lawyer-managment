import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import caseRoutes from './routes/caseRoutes';
import userRoutes from './routes/userRoutes';
import legalServiceRoutes from './routes/legalServiceRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import { UserController } from './controllers/UserController';

import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { prisma } from '../infrastructure/prisma';

const app = express();
const port = process.env.PORT || 3000;
const userController = new UserController();

app.use(cors());
app.use(express.json());

// Public lawyers list
app.get('/api/public/lawyers', userController.getPublicLawyers.bind(userController));

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
app.use('/api/services', legalServiceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);

app.use(errorHandler as any);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import caseRoutes from './routes/caseRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler as any);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

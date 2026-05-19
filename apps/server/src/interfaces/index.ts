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
import fs from 'fs';

// Función para asegurar permisos en los binarios de Prisma (Hostinger FIX)
const fixPrismaPermissions = () => {
  try {
    const prismaDir = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
    if (fs.existsSync(prismaDir)) {
      const files = fs.readdirSync(prismaDir);
      files.forEach(file => {
        if (file.startsWith('query-engine-')) {
          const filePath = path.join(prismaDir, file);
          fs.chmodSync(filePath, 0o755);
          console.log(`🔓 Permisos ajustados: ${file}`);
        }
      });
    }
  } catch (err) {
    console.error('⚠️ Error ajustando permisos de Prisma:', err);
  }
};

fixPrismaPermissions();

// Cargar variables de entorno prioritarias
const envFiles = [
  '.env',
  '.env.production',
  '.env.develop'
];

envFiles.forEach((file) => {
  const envPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`✅ [Config] Variables cargadas desde: ${file}`);
  }
});

import { prisma } from '../infrastructure/prisma';

const app = express();
const port = process.env.PORT || 3000;
const userController = new UserController();

app.use(cors());
app.use(express.json());

// Public lawyers list
app.get('/api/public/lawyers', userController.getPublicLawyers.bind(userController));

// Endpoint de prueba explícita para lectura de BD
app.get('/api/test-db', async (_req, res) => {
  try {
    // Intentamos leer el total de usuarios y los primeros 3 (ocultando datos sensibles)
    const count = await prisma.user.count();
    const users = await prisma.user.findMany({
      take: 3,
      select: { id: true, email: true, role: true }
    });
    
    res.json({
      success: true,
      message: '✅ Conexión de lectura exitosa',
      data: {
        totalUsers: count,
        sample: users
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '❌ Falló la lectura de la base de datos',
      error: error.message
    });
  }
});
// Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      database: 'Connected', 
      timestamp: new Date().toISOString(),
      env: {
        cwd: process.cwd(),
        db_url_defined: !!process.env.DATABASE_URL,
        db_user: process.env.DATABASE_URL ? process.env.DATABASE_URL.split(':')[1].replace('//', '') : 'NONE'
      }
    });
  } catch (err: any) {
    res.status(500).json({ 
      status: 'FAIL', 
      error: err.message,
      debug: {
        cwd: process.cwd(),
        db_url_defined: !!process.env.DATABASE_URL,
        db_user: process.env.DATABASE_URL ? process.env.DATABASE_URL.split(':')[1].replace('//', '') : 'NONE'
      }
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', legalServiceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);

app.use(errorHandler as any);

const startServer = async () => {
  try {
    console.log('🔄 Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('✅ CONECTADO EXITOSAMENTE A LA BASE DE DATOS MYSQL');
    
    const server = app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });

    // Manejo de cierre elegante para liberar el puerto en reinicios (ts-node-dev)
    process.on('SIGTERM', () => {
      server.close(() => {
        prisma.$disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      server.close(() => {
        prisma.$disconnect();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ FATAL: No se pudo conectar a la base de datos al arrancar.', error);
    process.exit(1);
  }
};

startServer();

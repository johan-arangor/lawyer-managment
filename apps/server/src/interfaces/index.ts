import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// --- DEBUG HOSTINGER ---
process.on('uncaughtException', (err) => {
  fs.appendFileSync('hostinger-error.log', `[${new Date().toISOString()}] Uncaught Exception: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  fs.appendFileSync('hostinger-error.log', `[${new Date().toISOString()}] Unhandled Rejection at: ${promise}, reason: ${reason}\n`);
});
// -----------------------

import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import caseRoutes from './routes/caseRoutes';
import userRoutes from './routes/userRoutes';
import legalServiceRoutes from './routes/legalServiceRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import { UserController } from './controllers/UserController';
import { logDebug } from '../infrastructure/debugLogger';

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

// Cargar variables de entorno prioritarias (Búsqueda robusta para Hostinger/Passenger)
const envFiles = [
  '.env',
  '.env.production',
  '.env.develop'
];

// Guardar el PORT original de Passenger/sistema antes de que dotenv lo sobrescriba
const originalPort = process.env.PORT;

envFiles.forEach((file) => {
  const possiblePaths = [
    path.resolve(process.cwd(), file),
    path.resolve(__dirname, file),
    path.resolve(__dirname, '../', file),
    path.resolve(__dirname, '../../', file)
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
      console.log(`✅ [Config] Variables cargadas desde: ${envPath}`);
      break;
    }
  }
});

// Restaurar el PORT original si existía (necesario para Phusion Passenger en Hostinger)
if (originalPort) {
  process.env.PORT = originalPort;
}

import { prisma } from '../infrastructure/prisma';

const app = express();
const port = process.env.PORT || 3000;
const userController = new UserController();

// Configuración robusta de CORS para soportar preflight OPTIONS y credenciales en Hostinger
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Permitir cualquier origen (dinámico para evitar el bloqueo de '*' en navegadores estrictos)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Origin', 'source']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  logDebug(`🔍 [API LOG] ${req.method} ${req.originalUrl}`);
  next();
});

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
  } catch (error: any) {
    console.error('❌ ERROR AL ARRANCAR: No se pudo conectar a la base de datos al inicio.', error.message);
  }

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
};

startServer();

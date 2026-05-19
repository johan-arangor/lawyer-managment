const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');

// Cargar el .env de producción explícitamente para la prueba
const envPath = path.resolve(__dirname, '.env.production');
dotenv.config({ path: envPath });

console.log('🧪 Iniciando diagnóstico de base de datos...');
console.log('📍 Cargando configuración desde:', envPath);
console.log('🔗 URL objetivo:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@') : 'NO DEFINIDA');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function test() {
    try {
        console.log('⏳ Intentando conectar con Prisma...');
        // Intento de consulta simple
        const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
        console.log('✅ ¡CONEXIÓN EXITOSA!', result);
    } catch (error) {
        console.error('❌ ERROR DE CONEXIÓN:');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        
        if (error.message.includes('Authentication failed')) {
            console.log('\n💡 SUGERENCIA: El usuario o la contraseña son incorrectos.');
        } else if (error.message.includes('Can\'t reach database server')) {
            console.log('\n💡 SUGERENCIA: El host (localhost/127.0.0.1) no responde o el puerto está bloqueado.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

test();

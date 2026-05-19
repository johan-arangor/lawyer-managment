const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de producción para que Prisma las use durante el build
const envProdPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envProdPath)) {
    dotenv.config({ path: envProdPath });
}

function build() {
    console.log('🚀 Iniciando proceso de build...');

    try {
        // 1. Generar cliente de Prisma
        console.log('📦 Generando cliente de Prisma...');
        execSync('npx prisma generate', { stdio: 'inherit' });

        // 2. Sincronizar Base de Datos (Producción)
        console.log('🔄 Sincronizando base de datos con el esquema...');
        // Usamos --accept-data-loss para evitar bloqueos en el build automatizado
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

        // 3. Compilar TypeScript
        console.log('🏗️ Compilando TypeScript...');
        execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });

        // 3. Crear carpeta dist/prisma si no existe
        const distPrismaPath = path.join(__dirname, 'dist', 'prisma');
        if (!fs.existsSync(distPrismaPath)) {
            fs.mkdirSync(distPrismaPath, { recursive: true });
        }

        // 4. Copiar schema.prisma
        console.log('📄 Copiando schema.prisma a dist/prisma...');
        fs.copyFileSync(
            path.join(__dirname, 'prisma', 'schema.prisma'),
            path.join(distPrismaPath, 'schema.prisma')
        );

        // 5. Copiar .env.production como .env en la raíz de dist
        const envProdPath = path.join(__dirname, '.env.production');
        if (fs.existsSync(envProdPath)) {
            console.log('🔐 Copiando .env.production a dist/.env...');
            fs.copyFileSync(envProdPath, path.join(__dirname, 'dist', '.env'));
        } else {
            console.warn('⚠️ Advertencia: .env.production no encontrado.');
        }

        // 6. Copiar package.json a dist
        console.log('📄 Copiando package.json a dist...');
        fs.copyFileSync(
            path.join(__dirname, 'package.json'),
            path.join(__dirname, 'dist', 'package.json')
        );

        console.log('✅ Build completado con éxito.');
    } catch (error) {
        console.error('❌ Error durante el build:', error.message);
        process.exit(1);
    }
}

build();

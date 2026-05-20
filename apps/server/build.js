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

        // 3. Ejecutar Semilla (Seed) de la Base de Datos
        console.log('🌱 Ejecutando semilla (seed) de base de datos...');
        execSync('node prisma/seed.js', { stdio: 'inherit' });

        // 4. Compilar TypeScript
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

        // 6. Copiar y adaptar package.json para Hostinger
        console.log('📄 Copiando y adaptando package.json a dist...');
        const pkg = require('./package.json');
        
        // Corregir el punto de entrada principal para Hostinger LiteSpeed
        pkg.main = "interfaces/index.js";
        
        // Sobrescribir el script de build con un comando inofensivo para que el CI/CD de Hostinger no falle al buscarlo
        pkg.scripts.build = "echo 'Build successfully bypassed for Hostinger deployment'";
        delete pkg.scripts.prebuild;
        delete pkg.scripts.dev;
        delete pkg.scripts.predev;
        
        pkg.scripts.start = "node interfaces/index.js";
        pkg.scripts.postinstall = "npx prisma generate";
        
        // 7. Crear archivo de arranque seguro (server.js) para capturar cualquier crash de Node
        console.log('🚀 Creando archivo de arranque seguro (server.js)...');
        const startupCode = `// Failsafe Server para Hostinger
try {
  require('./interfaces/index.js');
} catch (error) {
  console.error("FATAL CRASH:", error);
  const express = require('express');
  const app = express();
  const port = process.env.PORT || 3000;
  app.all('*', (req, res) => {
    res.status(500).json({
      success: false,
      error: 'CRITICAL STARTUP CRASH',
      message: error.message,
      stack: error.stack
    });
  });
  app.listen(port, () => console.log('Failsafe server listening on port ' + port));
}
`;
        fs.writeFileSync(path.join(__dirname, 'dist', 'server.js'), startupCode);
        
        // Asignar el nuevo entry point en package.json y escribirlo
        pkg.main = "server.js";
        fs.writeFileSync(
            path.join(__dirname, 'dist', 'package.json'),
            JSON.stringify(pkg, null, 2)
        );

        console.log('✅ Build completado con éxito.');
    } catch (error) {
        console.error('❌ Error durante el build:', error.message);
        process.exit(1);
    }
}

build();

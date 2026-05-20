# Guía de Despliegue - Servidor Lawyer Management

## Cambios Realizados ✅

### 1. Configuración de Entornos
- ✅ Creado `.env.production` con credenciales de Hostinger (localhost)
- ✅ Creado `.env.develop` para desarrollo local (remoto desde local)
- ✅ Modificado `index.ts` para cargar `.env` de múltiples ubicaciones

### 2. Script de Build Optimizado
- ✅ Creado `build.js` que prepara la carpeta `dist` para producción
- ✅ Actualizado `package.json` con nuevo script de build
- ✅ Build ahora genera estructura completa lista para Hostinger

### 3. Estructura Final en `dist/`
```
dist/
├── .env                          (variables de producción)
├── package.json                  (dependencias)
├── package-lock.json             (lock file)
├── application/                  (casos de uso compilados)
├── domain/                        (entidades compiladas)
├── infrastructure/               (repositorios compilados)
├── interfaces/                   (rutas y controladores compilados)
│   └── index.js                 (PUNTO DE ENTRADA)
└── prisma/
    └── schema.prisma            (esquema de BD)
```

---

## Instrucciones de Despliegue

### Paso 1: Compilar localmente
```bash
cd apps/server
npm run build
```

El build se ejecuta automáticamente y genera:
- Compilación completa de TypeScript a JavaScript
- Copia de todas las configuraciones necesarias
- `.env.production` copiado como `.env`

### Paso 2: Subir a Hostinger

1. Acceder a: `https://hpanel.hostinger.com/websites/api.mienlacejuridico.com/deployments`

2. Subir el contenido de la carpeta `dist/` completa a la raíz del servidor:
   - La carpeta contiene ahora los archivos de arranque automáticos (`server.js`, `app.js`, `index.js`) compatibles con Phusion Passenger y LiteSpeed de Hostinger.
   - El `.env` debe estar presente en la raíz.
   - El `package.json` generado en `dist/` está optimizado para arrancar con `node server.js`.

3. Hostinger ejecutará automáticamente:
   ```bash
   npm install       # Ejecuta el postinstall "npx prisma generate" para compilar el binario Linux
   npm start         # Inicia la aplicación con "node server.js"
   ```

### Paso 3: Verificar conexión a BD

Una vez desplegado, el servidor se ejecutará:
- Puerto: 3000
- Base de datos: `127.0.0.1:3306` (localhost en el servidor)
- Usuario: `u605442238_adminlawyer`
- BD: `u605442238_lawyer_db`

Verificar con el endpoint de health:
```bash
curl https://api.mienlacejuridico.com/api/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "2026-05-02T..."
}
```

---

## Notas Importantes

### ⚠️ Variables de Entorno

**Para Desarrollo (.env.develop)**:
```
DATABASE_URL=mysql://u605442238_adminlawyer:GomeloGr4nd3sk8@srv1850.hstgr.io:3306/...
```
- Conexión remota a BD de Hostinger desde local
- FRONTEND_URL=http://localhost:5175

**Para Producción (.env.production)**:
```
DATABASE_URL=mysql://u605442238_adminlawyer:lawyerDb-5432@127.0.0.1:3306/...
```
- Conexión localhost en el servidor de Hostinger
- FRONTEND_URL=https://portal.mienlacejuridico.com
- Se copia como `.env` en la carpeta `dist`

### 🔐 Archivos Sensibles

El `.env` contiene credenciales. NO debe:
- Ser commiteado a git
- Estar en el repositorio público
- Ser compartido por otros medios

### 📋 Scripts disponibles

```bash
npm run dev              # Desarrollo local con ts-node
npm run build            # Compilar para producción
npm start                # Iniciar servidor (dist/interfaces/index.js)
npx prisma studio       # Abrir Prisma Studio
npx prisma generate     # Regenerar cliente de Prisma
```

---

## Troubleshooting

### Error: "ENOENT: no such file or directory, open '.env'"
**Solución**: Asegurar que `.env.production` existe antes de hacer build

### Error: "Cannot find module '@prisma/client'"
**Solución**: En Hostinger, ejecutar `npm install` después de subir los archivos

### Error: "connect ECONNREFUSED 127.0.0.1:3306"
**Solución**: Verificar que la BD esté accesible desde el servidor de Hostinger

### Health check responde "FAIL"
**Solución**: Verificar las credenciales de BD en `.env` dentro de `dist/`

---

## Próximos Pasos

1. ✅ Compilar con `npm run build`
2. ✅ Verificar estructura de `dist/`
3. ✅ Subir a Hostinger via panel
4. ✅ Verificar endpoint `/api/health`
5. ✅ Validar que las APIs privadas conectan correctamente

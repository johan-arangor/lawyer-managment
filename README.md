# Legal ERP - Enlace Jurídico ⚖️

Sistema integral de gestión de casos judiciales, control de cartera y archivo digital automatizado.

## 🚀 Tecnologías
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Prisma ORM
- **Base de Datos:** MySQL
- **Almacenamiento:** Google Drive API (OAuth2)

---

## 🛠️ Configuración de Google Drive API

Para que el sistema pueda crear carpetas y subir archivos, debes configurar un proyecto en Google Cloud Console siguiendo estos pasos:

### 1. Crear Proyecto y Habilitar API
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto llamado **"Lawyer Management"**.
3. En el buscador superior, escribe **"Google Drive API"** y haz clic en **Habilitar**.

### 2. Configurar Pantalla de Consentimiento (OAuth Consent Screen)
1. Ve a "OAuth consent screen".
2. Selecciona **External** (si no tienes Google Workspace) y haz clic en Crear.
3. Completa los datos obligatorios (Nombre de la App, Email de soporte).
4. **IMPORTANTE:** En "Test users", agrega tu propio correo de Gmail para poder autorizar la app mientras está en modo de prueba.

### 3. Crear Credenciales (Client ID & Secret)
1. Ve a la pestaña **Credentials**.
2. Haz clic en **Create Credentials** > **OAuth client ID**.
3. Selecciona **Web Application**.
4. En **Authorized redirect URIs**, agrega: `https://developers.google.com/oauthplayground`
5. Al guardar, copia el `Client ID` y el `Client Secret` en tu archivo `.env`.

### 4. Obtener el REFRESH TOKEN (Paso Vital)
Google no entrega el Refresh Token directamente; debes obtenerlo usando el **OAuth Playground**:
1. Entra a [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Haz clic en el icono de engranaje (configuración) a la derecha y marca **"Use your own OAuth credentials"**.
3. Ingresa tu `Client ID` y `Client Secret`.
4. En la lista de APIs a la izquierda, busca **Drive API v3** y selecciona el scope: `https://www.googleapis.com/auth/drive` (acceso total).
5. Haz clic en **Authorize APIs** e inicia sesión con tu cuenta de Gmail.
6. Haz clic en **Exchange authorization code for tokens**.
7. Copia el valor de `refresh_token` y pégalo en tu `.env`.

---

## 📄 Variables de Entorno (.env)

El archivo `.env` en `apps/server` debe verse así:

```env
PORT=3000
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/nombre_base_datos"
JWT_SECRET="una_clave_segura_aleatoria"

# Google Drive Config
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
GOOGLE_REFRESH_TOKEN="1//xxx"
GOOGLE_DRIVE_PARENT_FOLDER_ID="id_de_la_carpeta_raiz_donde_se_crearan_los_casos"
```

> **Tip:** El `GOOGLE_DRIVE_PARENT_FOLDER_ID` lo obtienes de la URL de cualquier carpeta que crees manualmente en Drive (es el código largo después de `/folders/`).

---

## 🏗️ Instalación y Ejecución

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Ejecutar base de datos (Prisma):
   ```bash
   cd apps/server
   npx prisma db push
   npx prisma generate
   ```
3. Iniciar el sistema:
   ```bash
   npm run dev
   ```

El sistema estará disponible en `http://localhost:5173` y la API en `http://localhost:3000`.

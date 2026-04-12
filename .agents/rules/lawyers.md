---
trigger: always_on
---

Contexto del Proyecto:
Sistema informativo de gestión de casos jurídicos para el bufete "Enlace Jurídico". Permite a abogados y clientes visualizar el estado de sus casos, adjuntar documentación y consultar saldos. No incluye pasarelas de pago ni mensajería compleja.
Stack Tecnológico:
Frontend: Vite + React + TypeScript + Tailwind CSS
Backend: Node.js + Express + TypeScript
Base de Datos: PostgreSQL + Prisma ORM
Almacenamiento: Google Drive API (cuenta de servicio)
Validación: Zod
Autenticación: JWT + bcrypt
Arquitectura y Principios:
Monorepo con dos espacios: /apps/server (backend) y /apps/client (frontend).
Clean Architecture aplicada exclusivamente al backend. El frontend se mantiene pragmático y consume la API REST.
Capas backend: /domain (entidades, VO, contratos), /application (casos de uso), /infrastructure (Prisma, Drive, Auth, logs), /interfaces (controllers, routes, middleware).
DIP: Los casos de uso dependen de interfaces; las implementaciones concretas viven en infrastructure.
KISS + SOLID: Evitar abstracciones innecesarias. Usar interfaces solo cuando haya múltiples implementaciones reales o sea crítico para testing. Priorizar legibilidad y flujo lineal.
Funcionalidades Requeridas:
Auth JWT con roles: ADMIN, LAWYER, CLIENT.
CRUD de Casos: id, title, caseNumber, fees, paidBalance, description, status (PENDING, IN_PROGRESS, CLOSED), lawyerId, clientId, driveFolderId.
Integración Google Drive:
Al crear un caso, generar automáticamente una carpeta en Drive y persistir el driveFolderId en PostgreSQL.
Subida de archivos: el backend recibe multipart/form-data, stream el archivo directamente a la carpeta del caso usando googleapis.
Retornar el fileId o enlace compartido para almacenamiento opcional en BD.
Control de Acceso por Rol:
Abogados: solo casos donde lawyerId === user.id.
Clientes: solo casos donde clientId === user.id.
Admin: acceso total.
Entregables Esperados:
Árbol de carpetas completo y vacío.
package.json raíz con scripts dev, build, install:all usando concurrently y npm workspaces.
prisma/schema.prisma con modelos User, Case, enums de roles/estados y relaciones correctas.
GoogleDriveProvider.ts en /infrastructure que implemente una interfaz IStorageProvider (DIP), con métodos createFolder(caseName: string): Promise<string> y uploadFile(fileStream: ReadStream, folderId: string, fileName: string): Promise<string>.
Ejemplo concreto de CreateCaseUseCase.ts mostrando cómo se inyectan las dependencias y se respeta el flujo Clean Architecture.
Restricciones Técnicas:
TypeScript estricto ("strict": true en tsconfig.json).
Manejo de errores centralizado en Express (middleware de errores).
Variables de entorno para GOOGLE_SERVICE_ACCOUNT_KEY, JWT_SECRET, DATABASE_URL.
No incluir código boilerplate genérico ni librerías innecesarias. Priorizar MVP funcional y claro.
Instrucción Final:
Genera solo la estructura, configuración base y los archivos solicitados. Explica brevemente cómo fluyen las dependencias y cómo se garantiza KISS + Clean Architecture sin sobreingeniería. Usa bloques de código con rutas relativas para facilitar la creación manual.
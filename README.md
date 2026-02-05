# TaskMaster IA Backend - Bun + Elysia

Backend para TaskMaster IA construido con Bun, Elysia, Turso (SQLite) y Gemini AI.

## 🚀 Características

- **Framework**: Bun + Elysia para alto rendimiento
- **Base de Datos**: Turso (SQLite) con Drizzle ORM
- **Autenticación**: JWT con roles (admin, manager, collaborator, client)
- **IA**: Integración con Google Gemini para clasificación de tareas y estimación de tiempo
- **Email**: Servicio de notificaciones con Resend
- **Testing**: Suite completa de pruebas con Bun Test

## 📋 Requisitos Previos

- Bun (última versión)
- Node.js >= 20 (para algunas dependencias)

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd IssuesApiBun
```

2. Instala las dependencias:
```bash
bun install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:
```env
NODE_ENV=development
PORT=3001

# Database (Turso)
DATABASE_URL=file:./local.db
DATABASE_AUTH_TOKEN=

# Authentication (JWT)
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1h

# AI (Gemini)
GEMINI_API_KEY=your-gemini-api-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@tuprofedeia.com.co

# Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Firebase Admin SDK
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
# ... resto de configuraciones de Firebase
```

## 🏃 Ejecutar el Servidor

### Modo Desarrollo
```bash
bun run dev
```

### Modo Producción
```bash
bun run start
```

El servidor estará disponible en `http://localhost:3001`

## 🧪 Testing

### Ejecutar todos los tests
```bash
bun test
```

### Ejecutar tests en modo watch
```bash
bun test --watch
```

### Ejecutar tests con coverage
```bash
bun test --coverage
```

## 📁 Estructura del Proyecto

```
IssuesApiBun/
├── src/
│   ├── ai/                    # Servicios de IA
│   │   └── services/
│   │       ├── taskClassifierService.ts
│   │       └── timeEstimator.ts
│   ├── config/                # Configuraciones
│   │   ├── auth.ts
│   │   └── environment.ts
│   ├── controllers/           # Controladores
│   │   ├── authController.ts
│   │   ├── dashboardController.ts
│   │   ├── logController.ts
│   │   ├── taskController.ts
│   │   └── userController.ts
│   ├── db/                    # Base de datos
│   │   └── index.ts
│   ├── middleware/            # Middleware
│   │   └── auth.ts
│   ├── models/                # Modelos Drizzle
│   │   └── schema.ts
│   ├── routes/                # Rutas de la API
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── logs.ts
│   │   ├── notifications.ts
│   │   ├── tasks.ts
│   │   └── users.ts
│   ├── services/              # Servicios de negocio
│   │   ├── authService.ts
│   │   ├── emailService.ts
│   │   ├── notificationService.ts
│   │   └── taskService.ts
│   ├── types/                 # Tipos TypeScript
│   │   └── index.ts
│   └── index.ts               # Punto de entrada
├── tests/                     # Tests
│   ├── auth.test.ts
│   ├── dashboard.test.ts
│   ├── notifications.test.ts
│   ├── tasks.test.ts
│   └── users.test.ts
├── drizzle/                   # Migraciones Drizzle
├── .env.example              # Ejemplo de variables de entorno
├── drizzle.config.ts         # Configuración de Drizzle
├── package.json              # Dependencias
├── tsconfig.json             # Configuración TypeScript
└── README.md                 # Este archivo
```

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register-first-admin` - Registrar primer admin
- `POST /api/auth/register` - Registrar usuario (requiere admin)
- `POST /api/auth/forgot-password` - Recuperar contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/change-password` - Cambiar contraseña

### Usuarios
- `GET /api/users` - Obtener todos los usuarios (admin/manager)
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario
- `PUT /api/users/:id/notifications` - Actualizar configuración de notificaciones
- `PUT /api/users/:id/preferences` - Actualizar preferencias
- `DELETE /api/users/:id` - Eliminar usuario (admin)

### Tareas
- `GET /api/tasks` - Obtener todas las tareas
- `GET /api/tasks/my-tasks` - Obtener tareas del usuario
- `POST /api/tasks` - Crear tarea
- `GET /api/tasks/:id` - Obtener tarea por ID
- `POST /api/tasks/metrics` - Obtener métricas del dashboard
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea
- `PATCH /api/tasks/:id/status` - Actualizar estado de tarea
- `POST /api/tasks/:id/comments` - Añadir comentario a tarea

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales (admin/manager)
- `GET /api/dashboard/my-tasks` - Tareas del usuario
- `GET /api/dashboard/team` - Tareas del equipo (admin/manager)
- `GET /api/dashboard/metrics` - Métricas de rendimiento (admin/manager)
- `GET /api/dashboard/client` - Estadísticas del cliente

### Notificaciones
- `GET /api/notifications` - Obtener notificaciones del usuario
- `PATCH /api/notifications/:notificationId/read` - Marcar notificación como leída

### Logs
- `GET /api/logs` - Obtener logs del sistema (admin)

## 🔐 Roles de Usuario

- **admin**: Acceso completo a todas las funcionalidades
- **manager**: Gestión de tareas y equipo
- **collaborator**: Gestión de tareas asignadas
- **client**: Creación y seguimiento de sus propias tareas

## 🗄️ Base de Datos

### Tablas

- **users**: Usuarios del sistema
- **tasks**: Tareas y proyectos
- **comments**: Comentarios en tareas
- **files**: Archivos adjuntos
- **notifications**: Notificaciones del sistema

### Migraciones

```bash
# Generar migración
bun run db:generate

# Ejecutar migración
bun run db:migrate

# Push a la base de datos
bun run db:push

# Abrir Drizzle Studio
bun run db:studio
```

## 🤖 Integración con IA

### Clasificación de Tareas

El sistema utiliza Google Gemini para:
- Clasificar automáticamente la prioridad de las tareas
- Sugerir etiquetas relevantes
- Estimar el tiempo de completion

### Servicios de IA

- **TaskClassifierService**: Clasificación de tareas
- **TimeEstimator**: Estimación de tiempo

## 📧 Notificaciones

El sistema envía notificaciones por email usando Resend para:
- Nuevas tareas asignadas
- Cambios de estado
- Comentarios en tareas
- Actualizaciones importantes

## 🧪 Tests

La suite de pruebas cubre:

- **Autenticación**: Login, registro, cambio de contraseña
- **Usuarios**: CRUD, actualización de preferencias
- **Tareas**: CRUD, comentarios, métricas
- **Dashboard**: Estadísticas, rendimiento
- **Notificaciones**: Creación, lectura

## 🚀 Despliegue

### Vercel

El proyecto está configurado para despliegue en Vercel. El archivo `vercel.json` contiene la configuración necesaria.

### Variables de Entorno en Producción

Asegúrate de configurar todas las variables de entorno en tu plataforma de despliegue.

## 📝 Licencia

ISC

## 👥 Autor

John Paez

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para cualquier mejora.
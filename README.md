# 🎯 CITRO RESERVAS - Sistema de Gestión de Espacios

## Solución Cloud Completa con Base de Datos

Implementación profesional de un sistema de reserva de espacios académicos, desplegado en la nube con:

- **Frontend**: React 18 + Tailwind CSS (Vercel)
- **Backend**: Supabase (PostgreSQL)
- **API**: REST automática de Supabase
- **Autenticación**: Simple integrada en base de datos
- **Despliegue**: 100% cloud (sin servidores propios)

---

## 📦 CONTENIDOS DEL PAQUETE

```
citro-reservas/
├── 01_schema.sql              ← Schema SQL para Supabase
├── App.jsx                    ← Componente React principal
├── supabase.js                ← Cliente y funciones Supabase
├── package.json               ← Dependencias del proyecto
├── .env.example               ← Variables de entorno (ejemplo)
├── GUIA_DEPLOYMENT_NUBE.md   ← Guía paso a paso de despliegue
├── vite.config.js             ← Configuración Vite
├── tailwind.config.js         ← Configuración Tailwind
├── postcss.config.js          ← Configuración PostCSS
└── README.md                  ← Este archivo
```

---

## 🚀 INICIO RÁPIDO (5 MINUTOS)

### 1. Crear Proyecto en Supabase
```bash
1. Ve a https://supabase.com
2. Crea una cuenta (con GitHub es fácil)
3. Crea un nuevo proyecto: "citro-reservas"
4. Espera a que se inicialice
```

### 2. Crear Tablas
```bash
1. Ve a SQL Editor
2. Copia TODO el contenido de 01_schema.sql
3. Pegalo en el editor
4. Haz clic en "Run"
```

### 3. Obtener Credenciales
```bash
1. Ve a Settings → API
2. Copia: Project URL (Supabase URL)
3. Copia: anon public (API Key)
```

### 4. Desplegar en Vercel
```bash
1. Sube el código a GitHub
2. Ve a https://vercel.com
3. Importa el repositorio
4. Agrega las variables de entorno:
   VITE_SUPABASE_URL = ...
   VITE_SUPABASE_ANON_KEY = ...
5. Haz clic en Deploy
```

**¡Listo! Tu app estará en vivo en ~2 minutos**

---

## 🏗️ ARQUITECTURA

```
┌─────────────────────┐
│  Navegador Usuario  │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │ React App   │
    │ (Vercel)    │ ← https://citro-reservas.vercel.app
    └──────┬──────┘
           │
    ┌──────▼──────────┐
    │ REST API        │
    │ (Supabase Auto) │
    └──────┬──────────┘
           │
    ┌──────▼─────────────┐
    │ PostgreSQL DB      │
    │ (Supabase Cloud)   │ ← Automáticamente respaldada
    └────────────────────┘
```

---

## 🎨 CARACTERÍSTICAS

### Para Usuarios (Solicitantes)
- ✅ Crear solicitudes de reserva
- ✅ Ver mis reservas (estado: pendiente/aprobada/rechazada)
- ✅ Ver disponibilidad por: Día, Semana, Mes
- ✅ Notificaciones de estado

### Para Administradores
- ✅ Panel de solicitudes pendientes
- ✅ Aprobar/rechazar con validación de conflictos
- ✅ Ver todas las reservas
- ✅ Reportes y estadísticas
- ✅ Auditoría automática de cambios

### Sistema
- ✅ Base de datos PostgreSQL completa
- ✅ Validación de conflictos de horario
- ✅ Auditoría de todas las acciones
- ✅ Notificaciones automáticas
- ✅ Respaldos automáticos de datos

---

## 📋 TABLAS DE LA BASE DE DATOS

### `salas`
- id, nombre, descripción, capacidad, ubicación, color

### `usuarios`
- id, email, nombre, rol (usuario/admin), departamento

### `reservas`
- id, sala_id, usuario_id, fecha, hora_inicio, motivo, estado, descripción

### `notificaciones`
- id, usuario_id, reserva_id, tipo, título, mensaje, leída

### `auditoria`
- Registro automático de TODOS los cambios

---

## 🔐 SEGURIDAD

- ✅ Variables de entorno (NO hardcoded)
- ✅ API Key con permisos limitados
- ✅ HTTPS obligatorio (Vercel)
- ✅ Base de datos respaldada automáticamente
- ✅ Auditoría de cambios

---

## 💻 DESARROLLO LOCAL

```bash
# 1. Clonar
git clone https://github.com/tu-usuario/citro-reservas.git
cd citro-reservas

# 2. Instalar dependencias
npm install

# 3. Crear .env.local
cp .env.example .env.local
# Edita con tus credenciales de Supabase

# 4. Ejecutar
npm run dev

# 5. Abrir en navegador
# http://localhost:5173
```

### Credenciales Demo (Local)
- Usuario: `juan@citro.edu.mx` (se crea automáticamente)
- Admin: `admin@citro.edu.mx` (se crea automáticamente)

---

## 🌍 PRODUCCIÓN

### Vercel
```bash
1. Conecta tu repositorio GitHub
2. Agrega variables de entorno
3. Deploy automático en cada push
4. Obtén URL: https://citro-reservas.vercel.app
```

### Supabase
```bash
1. Plan gratuito soporta:
   - ~50GB de datos
   - 500K API calls/mes
   - Backups automáticos
2. Escala a pago cuando necesites más
```

---

## 📊 ESTADÍSTICAS & MONITOREO

### Dashboard Supabase
- Requests en tiempo real
- Uso de storage
- Tamaño de database
- Logs de errores

### Dashboard Vercel
- Analytics de performance
- Historial de deployments
- Error tracking

---

## 🆘 TROUBLESHOOTING

### "Module not found: @supabase/supabase-js"
```bash
npm install @supabase/supabase-js
```

### "Environment variables not defined"
- Verifica `.env.local` en la raíz
- Variables deben empezar con `VITE_`

### "No puede conectar a Supabase"
- Verifica la URL (debe ser: https://xxxxx.supabase.co)
- Verifica que el proyecto esté activo en Supabase

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **GUIA_DEPLOYMENT_NUBE.md** ← Guía completa paso a paso
- **01_schema.sql** ← Schema SQL con comentarios
- **supabase.js** ← Funciones helper comentadas

---

## 🤝 SOPORTE

### Supabase
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.io
- Email: support@supabase.io

### Vercel
- Docs: https://vercel.com/docs
- Status: https://www.vercel-status.com
- Support: help@vercel.com

---

## 📄 LICENCIA

Este proyecto es propietario de CITRO. Todos los derechos reservados.

---

## ✨ Hecho para CITRO
Sistema de Gestión de Reservas de Espacios Académicos
Marzo 2026

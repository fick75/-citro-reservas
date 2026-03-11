# 🚀 GUÍA COMPLETA: IMPLEMENTACIÓN CLOUD CON BASE DE DATOS

## 📋 ÍNDICE
1. [Arquitectura General](#arquitectura)
2. [Configuración de Supabase](#supabase)
3. [Configuración de Vercel](#vercel)
4. [Configuración Local](#local)
5. [Despliegue en Producción](#produccion)
6. [Mantenimiento y Monitoreo](#mantenimiento)

---

## 🏗️ ARQUITECTURA GENERAL {#arquitectura}

```
USUARIO (Frontend)
      ↓
   React App (Vercel)
      ↓
API REST (Supabase Auto-Generated)
      ↓
PostgreSQL Database (Supabase Cloud)
```

### Componentes:
- **Frontend**: React 18 + Tailwind CSS (Vercel)
- **Backend**: Supabase (PostgreSQL + API automática)
- **Autenticación**: Simple (sin Auth0, integrado en DB)
- **Almacenamiento**: PostgreSQL de Supabase

---

## 🔧 REQUISITOS PREVIOS

### Software Necesario:
- ✅ Git (https://git-scm.com)
- ✅ Node.js 18+ (https://nodejs.org)
- ✅ npm o yarn
- ✅ Cuenta en GitHub (gratuita)

### Cuentas en la Nube (Gratuitas):
- ✅ Supabase (https://supabase.com)
- ✅ Vercel (https://vercel.com)

---

## 💾 CONFIGURACIÓN DE SUPABASE {#supabase}

### PASO 1: Crear Proyecto en Supabase

1. **Acceder a Supabase**:
   - Ve a https://supabase.com
   - Haz clic en "Sign Up"
   - Crea cuenta con GitHub (recomendado)

2. **Crear Nuevo Proyecto**:
   - Haz clic en "New Project"
   - Nombre: `citro-reservas`
   - Contraseña: Guárdala bien (necesaria para conectarse)
   - Región: Selecciona la más cercana a tu ubicación (ej: `us-east-1`)
   - Haz clic en "Create New Project"

3. **Esperar Inicialización**:
   - Espera a que Supabase termine (2-3 minutos)
   - Verás el dashboard cuando esté listo

### PASO 2: Crear las Tablas con SQL

1. **Acceder al Editor SQL**:
   - En el dashboard, ve a `SQL Editor` (lado izquierdo)
   - Haz clic en "New Query"

2. **Copiar y Ejecutar el Schema**:
   - Copia TODO el contenido de `01_schema.sql` (archivo incluido)
   - Pégalo en el editor
   - Haz clic en "▶ Run" (botón azul)
   - Verás "Success" si todo está bien

3. **Verificar Tablas Creadas**:
   - Ve a `Table Editor` (lado izquierdo)
   - Deberías ver:
     - ✅ salas
     - ✅ usuarios
     - ✅ reservas
     - ✅ auditoria
     - ✅ notificaciones

### PASO 3: Obtener Credenciales

1. **Ir a Project Settings**:
   - Arriba a la derecha: ⚙️ Settings
   - Lado izquierdo: "API"

2. **Copiar las Claves**:
   ```
   Project URL (Supabase URL)
   Ejemplo: https://xyzabc.supabase.co
   
   anon public (API Key)
   Ejemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Guardar en Lugar Seguro**:
   - Copiar en un archivo de texto
   - ⚠️ NO compartir públicamente
   - Son necesarias para conectar la app

---

## 🎨 CONFIGURACIÓN DE VERCEL {#vercel}

### PASO 1: Preparar el Código en GitHub

1. **Crear Repositorio GitHub**:
   - Ve a https://github.com/new
   - Nombre: `citro-reservas`
   - Descripción: "Sistema de Gestión de Reservas CITRO"
   - Privado (recomendado)
   - Crear repositorio

2. **Descargar/Clonar**:
   ```bash
   cd ~/Documentos
   git clone https://github.com/TU_USUARIO/citro-reservas.git
   cd citro-reservas
   ```

3. **Estructura del Proyecto**:
   ```
   citro-reservas/
   ├── public/
   ├── src/
   │   ├── lib/
   │   │   └── supabase.js
   │   ├── App.jsx
   │   └── main.jsx
   ├── .env.example
   ├── .env.local (NO subir a git)
   ├── package.json
   ├── vite.config.js
   ├── tailwind.config.js
   ├── postcss.config.js
   └── .gitignore
   ```

4. **Agregar Archivos**:
   - Copia los archivos proporcionados a la estructura
   - No olvides `.env.example`

5. **Crear `.env.local`** (solo local):
   ```bash
   cp .env.example .env.local
   ```

6. **Editar `.env.local`**:
   ```
   VITE_SUPABASE_URL=https://xyzabc.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_api_key_aqui
   ```

7. **Actualizar `.gitignore`**:
   ```
   node_modules/
   .env.local
   .env
   dist/
   .DS_Store
   ```

8. **Subir a GitHub**:
   ```bash
   git add .
   git commit -m "feat: Initial CITRO Reservas setup"
   git push origin main
   ```

### PASO 2: Desplegar en Vercel

1. **Acceder a Vercel**:
   - Ve a https://vercel.com
   - Sign up with GitHub
   - Autorizar Vercel

2. **Importar Proyecto**:
   - Haz clic en "New Project"
   - Selecciona `citro-reservas` del listado
   - Haz clic en "Import"

3. **Configurar Variables de Entorno**:
   - Busca "Environment Variables"
   - Agrega:
     ```
     Name: VITE_SUPABASE_URL
     Value: https://xyzabc.supabase.co
     
     Name: VITE_SUPABASE_ANON_KEY
     Value: tu_api_key_aqui
     ```
   - Haz clic en "Add"

4. **Deploy**:
   - Haz clic en "Deploy"
   - Espera a que termine (2-3 minutos)
   - Verás URL tipo: `https://citro-reservas.vercel.app`

5. **Verificar Deployment**:
   - Abre la URL en el navegador
   - Deberías ver la pantalla de login

---

## 💻 CONFIGURACIÓN LOCAL {#local}

### PASO 1: Clonar y Instalar

```bash
git clone https://github.com/TU_USUARIO/citro-reservas.git
cd citro-reservas
npm install
```

### PASO 2: Configurar Variables Locales

```bash
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase
```

### PASO 3: Ejecutar Localmente

```bash
npm run dev
```

Abre: http://localhost:5173

### PASO 4: Probar Flujo Completo

**Como Usuario**:
1. Login: `juan@citro.edu.mx` (se crea automático)
2. Nueva solicitud → Crear reserva
3. Ver en "Mis Reservas"
4. Ver disponibilidad

**Como Admin**:
1. Login: `admin@citro.edu.mx`
2. Panel Admin → Solicitudes Pendientes
3. Aprobar/Rechazar solicitud
4. La reserva aparece en disponibilidad

---

## 🌍 DESPLIEGUE EN PRODUCCIÓN {#produccion}

### Flujo de Actualización

1. **Hacer cambios localmente**:
   ```bash
   git checkout -b feature/mejora-nueva
   # Hacer cambios
   git add .
   git commit -m "feat: Descripción del cambio"
   ```

2. **Subir a GitHub**:
   ```bash
   git push origin feature/mejora-nueva
   ```

3. **Crear Pull Request**:
   - En GitHub, aparecerá opción "Compare & Pull Request"
   - Describe los cambios
   - Haz clic en "Create Pull Request"

4. **Deploy Automático**:
   - Vercel crea una URL de preview
   - Si todo está bien, haz clic en "Merge Pull Request"
   - Vercel redeploya automáticamente en producción

### Dominio Personalizado (Opcional)

1. **En Vercel**:
   - Proyecto → Settings → Domains
   - Agrega tu dominio: `reservas.citro.edu.mx`

2. **En tu Proveedor de Dominio**:
   - Apunta los DNS a Vercel (Vercel te muestra los pasos)

---

## 🔐 SEGURIDAD

### En Supabase:

1. **Row Level Security (RLS)**:
   - Ve a `Authentication` → `Policies`
   - Habilita RLS en todas las tablas
   - Crea políticas para que usuarios solo vean sus reservas

2. **Backups Automáticos**:
   - Settings → Database
   - Verifica que backups estén habilitados

### En Vercel:

1. **Nunca**:
   - ❌ Subas `.env.local` a GitHub
   - ❌ Compartas claves públicamente

2. **Siempre**:
   - ✅ Usa variables de entorno
   - ✅ Rota claves periódicamente

---

## 📊 MONITOREO {#mantenimiento}

### En Supabase:

1. **Monitorar Uso**:
   - Dashboard → Realtime Stats
   - Mira: Requests, Storage, Database size

2. **Logs**:
   - Logs → Database Logs
   - Busca errores o actividad inusual

### En Vercel:

1. **Monitorar Performance**:
   - Project → Analytics
   - Ve response times y errores

2. **Deployments**:
   - Project → Deployments
   - Historial de cambios

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Error: "VITE_SUPABASE_URL is undefined"
- Verifica que `.env.local` existe en la raíz
- Las variables deben empezar con `VITE_`

### Error: "Connection refused" a Supabase
- Verifica que la URL esté correcta
- Asegúrate de copiar la URL completa

### Las reservas no se guardan
- Abre DevTools (F12) → Console
- Busca mensajes de error
- Verifica que la tabla `usuarios` tenga registros

---

## 📞 SOPORTE

### Recursos Útiles:

- 📖 Docs Supabase: https://supabase.com/docs
- 📖 Docs Vercel: https://vercel.com/docs
- 💬 Community Supabase: https://discord.supabase.io

### Preguntas Frecuentes:

**¿Es gratis?**
- Supabase: Sí (plan gratuito generoso)
- Vercel: Sí para proyectos públicos/pequeños

**¿Cuántos usuarios puedo tener?**
- Supabase plan free: ~50GB de datos
- Vercel: sin límites de usuarios

**¿Puedo exportar mis datos?**
- Sí, desde Supabase → Settings → Backups

---

## ✅ CHECKLIST FINAL DE DESPLIEGUE

- [ ] Creaste proyecto en Supabase
- [ ] Ejecutaste el schema SQL
- [ ] Obtuviste URL y API Key
- [ ] Creaste repositorio en GitHub
- [ ] Conectaste Vercel a GitHub
- [ ] Configuraste variables en Vercel
- [ ] El deploy fue exitoso
- [ ] Probaste login local
- [ ] Probaste crear una reserva
- [ ] Probaste como admin

¡Tu aplicación está LISTA para producción! 🎉


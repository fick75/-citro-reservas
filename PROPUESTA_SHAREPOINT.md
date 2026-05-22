# CITRO Reservas — Propuesta de Plataforma Unificada en SharePoint

## Resumen Ejecutivo

Esta propuesta describe la migración e integración del sistema CITRO Reservas como un **sitio unificado dentro de Microsoft SharePoint Online**, aprovechando la infraestructura existente de Microsoft 365 de la institución. La solución permite gestionar reservas de salas directamente desde el portal corporativo, sin necesidad de herramientas externas.

---

## 1. Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────┐
│                   SHAREPOINT ONLINE                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Sitio de Comunicación: CITRO Reservas       │   │
│  │                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │  Web Part    │  │  Web Part    │  │ Web Part │  │   │
│  │  │  Dashboard   │  │  Calendario  │  │  Admin   │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  │   │
│  └─────────┼────────────────┼───────────────┼─────────┘   │
│            │                │               │              │
│  ┌─────────▼────────────────▼───────────────▼─────────┐   │
│  │              SharePoint Lists (Datos)               │   │
│  │  ├── Salas          ├── Reservas                   │   │
│  │  ├── Usuarios       └── Notificaciones             │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐   │
│  │         Microsoft 365 Services                      │   │
│  │  ├── Azure AD (Autenticación automática)            │   │
│  │  ├── Power Automate (Aprobaciones y correos)        │   │
│  │  ├── Outlook Calendar (Sincronización)              │   │
│  │  └── Teams (Notificaciones)                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes de la Solución

### 2.1 Sitio SharePoint de Comunicación
- **Tipo:** Communication Site (sitio moderno)
- **URL:** `https://uvmx.sharepoint.com/sites/AgendadeEspacios`
- **Navegación:** Menú lateral con secciones por rol (Usuario / Administrador)
- **Tema:** Color institucional + branding CITRO

### 2.2 Web Parts SPFx (SharePoint Framework)
Los componentes de React existentes se adaptan como web parts desplegables en cualquier página SharePoint:

| Web Part | Descripción | Página sugerida |
|---|---|---|
| `CitroReservasDashboard` | Vista principal del usuario con sus reservas | Inicio |
| `CitroCalendario` | Disponibilidad de salas por día/semana/mes | Calendario |
| `CitroNuevaReserva` | Formulario de solicitud de reserva | Inicio / Modal |
| `CitroAdminPanel` | Panel de aprobaciones para administradores | Admin |
| `CitroEstadisticas` | Reportes y métricas de uso | Reportes |

### 2.3 Listas SharePoint (Base de datos)
Reemplazan a Supabase. Los datos se almacenan de forma nativa en SharePoint:

| Lista | Equivalente actual | Columnas clave |
|---|---|---|
| `Salas` | tabla `salas` | Nombre, Capacidad, Ubicación, Color, Activa |
| `Reservas` | tabla `reservas` | Sala, Solicitante, Fecha, HoraInicio, Duración, Motivo, Estado |
| `Notificaciones` | tabla `notificaciones` | Usuario, Reserva, Tipo, Título, Leída |

### 2.4 Autenticación — Sin cambios para el usuario
- **Autenticación automática** vía Azure AD / cuenta Microsoft 365 institucional
- El usuario accede con su cuenta de correo institucional sin login adicional
- Los roles se gestionan mediante **Grupos de SharePoint**:
  - `CITRO-Usuarios` → rol solicitante
  - `CITRO-Admins` → rol administrador
  - `CITRO-Directores` → rol director

### 2.5 Automatizaciones con Power Automate
Flujos que reemplazan la lógica de notificaciones manual:

| Flujo | Disparador | Acción |
|---|---|---|
| Notificar nueva solicitud | Nueva reserva creada | Email al administrador |
| Notificar aprobación | Estado cambia a APROBADA | Email al solicitante + evento Outlook |
| Notificar rechazo | Estado cambia a RECHAZADA | Email al solicitante con motivo |
| Recordatorio de reserva | 1 hora antes de la reserva | Email + notificación Teams |

---

## 3. Plan de Implementación (4 fases)

### Fase 1 — Preparación (1-2 días)
- [ ] Crear el sitio de comunicación en SharePoint Online
- [ ] Ejecutar `sharepoint/scripts/Create-SharePointLists.ps1` para crear listas y grupos
- [ ] Configurar grupos y permisos por rol
- [ ] Configurar el tema visual institucional

### Fase 2 — Desarrollo del Web Part (3-5 días)
- [ ] Ingresar a la carpeta `sharepoint/` y ejecutar `npm install`
- [ ] Ajustar la URL del sitio en `config/serve.json`
- [ ] Compilar con `npm run build` y verificar en Workbench local
- [ ] Probar el web part con `gulp serve`

### Fase 3 — Despliegue (1 día)
- [ ] Empaquetar: `npm run package`
- [ ] Subir `solution/citro-reservas.sppkg` al App Catalog del tenant
- [ ] Instalar la app en el sitio de reservas
- [ ] Agregar el web part a la página de inicio

### Fase 4 — Automatizaciones y capacitación (1-2 días)
- [ ] Crear los 4 flujos de Power Automate
- [ ] Agregar usuarios a los grupos CITRO-*
- [ ] Capacitar administradores (30 min)
- [ ] Documentar URL del sitio y acceso

**Tiempo total estimado: 6-10 días hábiles**

---

## 4. Estructura de Archivos del Proyecto SPFx

```
sharepoint/
├── config/
│   ├── package-solution.json      ← Metadatos y permisos de la solución
│   └── serve.json                 ← Config de desarrollo local
├── scripts/
│   └── Create-SharePointLists.ps1 ← Crea listas, columnas y grupos en SP
├── src/
│   └── webparts/
│       └── citroReservas/
│           ├── CitroReservasWebPart.ts         ← Punto de entrada SPFx
│           ├── CitroReservasWebPart.manifest.json
│           └── components/
│               ├── CitroReservasApp.tsx         ← App React principal
│               ├── CitroReservasApp.module.scss
│               ├── hooks/
│               │   ├── useSharePointData.ts     ← CRUD sobre SP Lists
│               │   └── useCurrentUser.ts        ← Rol desde grupos SP
│               └── views/
│                   ├── UserDashboard.tsx         ← Vista de usuario
│                   └── AdminDashboard.tsx        ← Panel admin
├── gulpfile.js
├── package.json
└── tsconfig.json
```

---

## 5. Ventajas de esta Solución

| Aspecto | Situación actual | Con SharePoint |
|---|---|---|
| **Acceso** | URL externa (Vercel) | Dentro del portal institucional |
| **Autenticación** | Login manual (email+rol) | SSO automático con cuenta M365 |
| **Datos** | Supabase (servicio externo) | SharePoint Lists (dentro del tenant) |
| **Costo adicional** | Vercel + Supabase | Incluido en licencias M365 existentes |
| **Notificaciones** | Sin notificaciones automáticas | Email + Teams + Outlook automáticos |
| **Mantenimiento** | Gestión de BD externa | Microsoft gestiona la infraestructura |
| **Soporte IT** | Servicios externos | Dentro del entorno ya soportado por IT |

---

## 6. Requisitos Previos

- Licencia Microsoft 365 (E1, E3 o E5) con SharePoint Online activo
- Permisos de administrador del sitio SharePoint (o Global Admin para App Catalog)
- Node.js 18.x y módulo PnP.PowerShell instalados localmente

---

## 7. Consideraciones de Seguridad

- **Datos en el tenant propio**: toda la información queda dentro de la infraestructura Microsoft de la institución
- **Permisos granulares**: SharePoint permite control fino por lista, columna y usuario
- **Auditoría nativa**: SharePoint registra automáticamente cambios y accesos
- **HTTPS siempre activo**: incluido en SharePoint Online sin configuración adicional
- **Sin credenciales externas**: se elimina la necesidad de gestionar API keys de Supabase

---

## 8. Opción Simplificada — Integración rápida con iFrame

Si se necesita una solución en menos de 1 día sin desarrollo:

1. Mantener la app actual en Vercel tal cual
2. Crear un sitio SharePoint de comunicación
3. Agregar una página con el web part nativo **"Embed"** de SharePoint
4. Configurar la URL de Vercel en el web part Embed

**Ventaja:** Implementación en horas, sin reescribir código  
**Limitación:** Experiencia visual menos integrada (iFrame dentro de SharePoint)

---

## 9. Recomendación Final

Se recomienda la **implementación con SPFx** (solución completa) porque:

1. La app ya está construida en React — el esfuerzo de adaptación es mínimo
2. Los datos quedan dentro del tenant institucional (cumplimiento y seguridad)
3. Los usuarios no notan diferencia: el sistema aparece como parte natural del portal
4. Se elimina la dependencia de servicios externos
5. Las automatizaciones de Power Automate agregan valor inmediato sin código adicional

---

*Versión: 1.0 — Mayo 2026*

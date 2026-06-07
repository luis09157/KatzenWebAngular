# KatzenVet Web (Angular)

Aplicación web de **KatzenVet**: sitio público, panel administrativo para staff y portal del dueño de mascotas. Construida con **Angular 17**, **Angular Material MDC**, **Firebase** (Auth, Realtime Database, Hosting, Cloud Functions) y **SweetAlert2**.

**Producción:** https://katzen-a0e3e.web.app

---

## Módulos principales

| Área | Ruta | Descripción |
|------|------|-------------|
| Landing | `/` | Sitio institucional, contacto y acceso al portal |
| Admin | `/admin/*` | Panel de gestión clínica (staff) |
| Login admin | `/admin/login` | Acceso personal autorizado |
| Portal clientes | `/portal/*` | Expediente en línea para dueños |
| Login portal | `/portal/login` | Acceso clientes |

### Admin (`/admin`)

Módulos protegidos por rol (`StaffRoleGuard`): inicio, usuarios, clientes, pacientes, citas, historiales, recordatorios, vacunas, baños, inventario, contactos web, etc.

### Portal (`/portal`)

Consulta de mascotas, vacunas, citas, historial clínico, notificaciones y perfil. Acceso restringido a clientes con portal activo.

---

## Autenticación y sesión

- **Firebase Auth** (email/contraseña) con custom claims sincronizados desde `Katzen/AuthPerfiles` vía Cloud Function `syncMyClaims`.
- Perfiles y permisos: `AuthProfileService`, guards (`AuthGuard`, `PortalAuthGuard`, `StaffRoleGuard`).
- **Checkbox “Mantener sesión activa”** en los tres puntos de login (admin, portal y modal del landing):
  - **Marcado:** persistencia local; sesión válida hasta **7 días** (`AuthSessionService` + `localStorage`).
  - **Sin marcar:** sesión de pestaña/navegador (`sessionStorage` + persistencia `SESSION`).
- Si la sesión guardada sigue vigente, el login se **omite** y se redirige directo al sistema (admin → `/admin/inicio`, clientes → `/portal/mascotas`).
- Al expirar la sesión guardada se cierra Firebase Auth y se muestra aviso para volver a iniciar sesión.

Servicios clave:

- `src/app/auth/auth.service.ts`
- `src/app/core/services/auth-session.service.ts`
- `src/app/portal/services/portal-auth.service.ts`

---

## Stack técnico

- Angular 17 · Angular Material 17 (MDC) · RxJS 7 · TypeScript 5.4
- `@angular/fire` 17 · Firebase 10
- Cypress 13 (E2E)
- Cloud Functions (Node) en `functions/`

---

## Requisitos

- Node.js 18+ (recomendado LTS)
- npm 9+
- Cuenta/proyecto Firebase (`katzen-a0e3e`)
- Firebase CLI (`npm i -g firebase-tools`) para deploy manual

---

## Instalación y desarrollo

```bash
git clone git@github.com:luis09157/KatzenWebAngular.git
cd KatzenWebAngular
npm install
npm start
```

La app queda en **http://localhost:4200**.

Configuración Firebase en `src/environments/environment.ts` y `environment.prod.ts`.

---

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build de producción (`dist/katzenvet`) |
| `npm run e2e` | Cypress headless |
| `npm run cy:open` | Cypress interactivo |
| `npm run cy:admin` | Smoke E2E del panel admin |
| `npm run functions:build` | Compilar Cloud Functions |
| `npm run functions:deploy` | Desplegar functions |

---

## Deploy

### Manual (Hosting)

```bash
npm run build
firebase deploy --only hosting
```

También puedes desplegar reglas RTDB, Storage o functions:

```bash
firebase deploy --only database,storage,functions
```

### CI (GitHub Actions)

El workflow `.github/workflows/firebase-hosting-merge.yml` despliega automáticamente a Firebase Hosting al hacer merge/push en la rama **`PROD`**.

Los deploys manuales desde `main` no disparan ese workflow; usa push a `PROD` o deploy manual con Firebase CLI.

---

## Estructura del proyecto (resumen)

```
src/app/
  auth/              Login y guards admin
  core/              Servicios compartidos, config admin UI, tokens
  dashboard/         Inicio admin
  landing/           Sitio público
  portal/            Portal del dueño
  layouts/           Shell del panel admin
  clientes/          CRUD clientes
  pacientes/         Expediente clínico
  inventario/        Inventario y órdenes
  ...                Otros módulos clínicos

src/styles/          Estilos globales admin (dialog, table, CRUD, layout)
functions/src/       Cloud Functions (claims, provisión usuarios)
cypress/e2e/         Pruebas E2E
docs/                Documentación de arquitectura UI admin
```

---

## UI del panel admin

Patrón unificado estilo Stripe/Linear:

- Layout: `admin-page` + `app-admin-data-panel`
- Diálogos: `admin-dialog-shell`, `form-grid`, `ADMIN_DIALOG_CONFIG`
- Estilos globales en `angular.json`: `admin-dialog.scss`, `admin-crud.scss`, `admin-table.scss`, etc.

Guías detalladas:

- [`docs/ADMIN-UI-ARCHITECTURE.md`](docs/ADMIN-UI-ARCHITECTURE.md)
- [`docs/ADMIN-UI-GEMINI-HANDOFF.md`](docs/ADMIN-UI-GEMINI-HANDOFF.md)

---

## Firebase

| Recurso | Archivo / notas |
|---------|------------------|
| Hosting | `firebase.json` → `dist/katzenvet` |
| RTDB rules | `database.rules.json` |
| Storage rules | `storage.rules` |
| Functions | `functions/src/index.ts` |

Proyecto Firebase: **katzen-a0e3e**

---

## Licencia

Proyecto privado — KatzenVet.

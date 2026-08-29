# Spec: Perfiles duales y dueñas operativas

**ID:** 012-perfiles-dual-y-duenas  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** agente (política Luis Alfonso Niño Martínez)

---

## Problema

El sistema de perfiles está confuso: “usuario” mezcla staff y portal; las doctoras son dueñas operativas pero el modelo no lo documenta; el caso real **staff + dueño de mascotas** (`dualAccess`) no tiene UI post-login ni un flujo claro para vincular `clienteId` a personal existente.

---

## User stories

### US-1 — Modelo de perfiles claro

Como **equipo / agente**  
Quiero **una matriz documentada de perfiles**  
Para **no confundir staff, portal cliente, dual y dueña operativa**

**Criterios de aceptación:**

- [x] SC-001: `domain-context` documenta matriz Dueña/doctora · Staff · Cliente portal · Dual
- [x] SC-002: UI admin “Usuarios” usa naming “Personal staff” vs “Clientes portal” (sin “usuario” ambiguo en títulos clave)
- [x] SC-003: `super_admin` / alias dueño documentado y mapeado mínimo en `staff-role.config.ts` (acceso `*`)

### US-2 — Selector de contexto post-login (dual)

Como **doctora / staff con mascotas propias**  
Quiero **elegir Admin clínica o Portal mis mascotas** tras iniciar sesión  
Para **entrar al contexto correcto sin redirects en bucle**

**Criterios de aceptación:**

- [x] SC-004: Si `dualAccess` tras **login admin** (`/admin/login`) → `/auth/contexto`. Si entra por **portal/landing** → directo `/portal/*` **sin** selector ni acceso admin (lock de entrada; hotfix 2026-08-27).
- [x] SC-005: Atajo “Ir a mi portal” en admin si tiene `clienteId`
- [x] SC-006: Atajo “Ir a panel admin” en portal si es staff
- [x] SC-007: `AuthGuard` / `PortalAuthGuard` respetan dual sin bucles

### US-3 — Vincular cliente portal a staff

Como **administrador**  
Quiero **vincular un registro Cliente a un staff existente**  
Para **activar perfil dual sin crear segunda cuenta Auth**

**Criterios de aceptación:**

- [x] SC-008: Callable `linkStaffPortalCliente` (admin) actualiza `AuthPerfiles` aditivo (`role` dual / `roles` + `clienteId`) y `Cliente.authUid` / `portalActivo`
- [x] SC-009: UI en módulo Personal: acción “Vincular portal (dual)”

---

## Fuera de alcance

- Módulo finanzas / caja
- Rotar password admin Cypress
- Desvincular dual / migración masiva de perfiles
- Registro self-service landing → portal (sigue en backlog)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo campos opcionales / updates aditivos en `AuthPerfiles` y `Cliente`. Sin renombrar nodos. App móvil: claims `dualAccess` ya existen.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/AuthPerfiles/{uid}` | staff / self | admin / Functions | `role: dual`, `roles[]`, `clienteId` opcionales |
  | `Katzen/Cliente/{id}` | staff / client propio | staff / Functions | `authUid`, `portalActivo` (ya existentes) |
  | `Katzen/Usuarios/{uid}` | staff | admin | sin cambio estructural |
  | `Katzen/PortalProvisionLog` | staff | Functions | log `link_staff_dual` |

- **Estrategia de Datos de Prueba:** mocks locales / Cypress con credencial admin existente en `cypress.env` (no rotar, no imprimir password). Smoke dual con mocks si no hay usuario dual real.
- **Patrones UI:** login cards existentes; selector contexto estilo auth; diálogo vincular con `admin-dialog-shell`; atajos en menús admin/portal.
- **Regla UI permanente:** Toda UI nueva (auth, portal, admin, landing) debe verse coherente con el design system existente, centrada/equilibrada en desktop, y responsiva; no layouts aplastados a un lado con huecos vacíos. `/auth/contexto` reutiliza `auth.component.css` (`.admin-auth-page` / `.admin-auth-card`) vía `styleUrls`.

---

## Roles

| Perfil | Admin panel | Portal | Notas |
|--------|-------------|--------|-------|
| Dueña operativa / doctora | sí (todo, política 011) | si dual | Identidad operativa de dueñas |
| Staff (admin, recepcionista, peluquero, doctor) | sí | si dual | Roles de identidad |
| Cliente portal puro | no | sí | Dueños externos |
| Dual | sí | sí | `dualAccess` / `role: dual` |
| `super_admin` | sí (`*`) | si dual | Alias desarrollador / dueño sistema |

---

## UI (rutas y layout)

- `/auth/contexto` — selector Admin vs Portal (shell centrado = login admin; `styleUrls` incluye `auth.component.css`)
- Atajos en `AdminMainLayout` y `PortalLayout`
- `/admin/usuarios` — vincular dual
- Fix 2026-08-26: card de contexto estaba pegada a la izquierda por encapsulación CSS (clases sin estilos); corregido reutilizando el shell auth.

---

## Backend

- [x] Cloud Function: `linkStaffPortalCliente`
- [ ] Reglas RTDB: sin cambio (preferido)
- [ ] Email: no (usa misma credencial staff)

---

## Testing mínimo

Ver `tasks.md`.

---

## Notas / decisiones

- Dueñas operativas = doctoras (negocio 2026-08-26).
- Acceso admin unificado ya en 011; esta spec ordena perfiles + dual.
- Credencial Cypress admin: **no rotar** en este turno.

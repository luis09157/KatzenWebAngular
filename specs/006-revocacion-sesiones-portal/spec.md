# Spec: Revocación inmediata de sesiones al desactivar portal

**ID:** 006-revocacion-sesiones-portal  
**Estado:** done  
**Fecha:** 2026-08-25  
**Autor:** Cursor agent / Luis Alfonso Niño Martínez  

---

## Problema

Al desactivar el portal de un cliente, `deactivatePortalClient` ya marca `portalActivo: false`, `AuthPerfiles.activo: false` y `disabled: true` en Firebase Auth. Sin embargo, **no** llama a `admin.auth().revokeRefreshTokens(uid)`, por lo que tokens JWT y refresh tokens vigentes pueden seguir usándose hasta su expiración natural.

Esto contradice la decisión de negocio **#18** (`domain-context.md`): desactivar portal debe revocar sesiones **de inmediato**. Hallazgo documentado en `AUDIT-CODE.md` ítem 3.

---

## User stories

### US-1 — Cierre inmediato de sesión portal

Como **administrador**  
Quiero **que al desactivar el portal de un cliente se invaliden sus sesiones activas de inmediato**  
Para **impedir que siga consultando datos clínicos con un token aún válido**

**Criterios de aceptación:**

- [x] SC-001: Tras `deactivatePortalClient` exitoso, se ejecuta `admin.auth().revokeRefreshTokens(uid)` además de `disabled: true`
- [x] SC-002: RTDB sigue actualizando `portalActivo: false` y `AuthPerfiles.activo: false` (sin cambios de esquema destructivos)
- [x] SC-003: Si `revokeRefreshTokens` falla tras haber aplicado `disabled: true` y updates RTDB, la cuenta permanece deshabilitada y la callable reporta error claro (`failed-precondition`) — no se hace rollback de `disabled`

### US-2 — Feedback admin al desactivar

Como **administrador**  
Quiero **ver loading contextual al desactivar portal y un mensaje claro de éxito o error**  
Para **saber que la operación terminó y si la revocación falló**

**Criterios de aceptación:**

- [x] SC-004: Overlay usa mensaje contextual «Actualizando…» al desactivar portal (`LoadingService` / patrón 005)
- [x] SC-005: Éxito y error cierran el overlay (`hide` en success y catch); mensaje de error vía `ErrorMessagesService`

---

## Fuera de alcance

- Cascada completa de baja lógica de cliente (mascotas, citas, Auth) — decisión #22 / deuda aparte
- `bajaLogicaCliente` en Angular (solo RTDB; no pasa por Functions) — no se modifica en esta entrega
- Revocación al desactivar usuarios **staff** (`updateStaffUser`)
- Deploy a producción (`firebase deploy`) — requiere autorización explícita de Luis
- Emulador E2E de Auth refresh tokens (validación por revisión de código + builds)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno nuevo. Se reutilizan los mismos updates aditivos ya existentes en `deactivatePortalClient` (`portalActivo`, `portalDeactivatedAt`, `portalDeactivatedBy`, `AuthPerfiles.activo`, log `PortalProvisionLog`). La app móvil no se ve afectada: solo Auth Admin SDK.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Cliente/{id}` | function | function | `portalActivo: false` (existente) |
  | `Katzen/AuthPerfiles/{uid}` | function | function | `activo: false` (existente) |
  | `Katzen/PortalProvisionLog` | staff | function | audit `action: deactivate` (existente) |
  | Firebase Auth | Admin SDK | Admin SDK | `disabled: true` + **nuevo** `revokeRefreshTokens` |

- **Estrategia de Datos de Prueba:** mocks / emuladores; prohibido RTDB producción (`katzen-a0e3e`). Validación primaria: compilación Functions + Angular + revisión de flujo en código.

- **Patrones UI Reutilizados:** módulo Usuarios (tab portal), SweetAlert2 confirmación, `LoadingService` + `LOADING_MESSAGES.updating`, `ErrorMessagesService` contexto `desactivar portal cliente`.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (callable admin + UI Usuarios) |
| doctor | no (desactivar portal) |
| recepcionista | no |

---

## UI (rutas y layout)

- Ruta: `/admin/usuarios` (tab portal clientes) — sin layout nuevo
- Acción existente: «Desactivar portal»
- Loading: `LOADING_MESSAGES.updating` («Actualizando…»)

---

## Backend

- [x] Cloud Function: `deactivatePortalClient` — añadir `revokeRefreshTokens(uid)`
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md` sección Testing y validación exhaustiva.

---

## Notas / decisiones

- Decisión dominio **#18**: revocación inmediata + `disabled: true`.
- Política de error (confirmada en plan): **Auth disabled + revoke**; si revoke falla → dejar `disabled` / RTDB ya aplicados y reportar error al admin (sin rollback).
- Referencias: `AUDIT-CODE.md` §3, `domain-context.md` §4.8 / backlog §12, `ROADMAP.md` deuda técnica.

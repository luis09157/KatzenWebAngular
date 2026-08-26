# Tasks: Revocación inmediata de sesiones al desactivar portal

**Spec:** `specs/006-revocacion-sesiones-portal/spec.md`  
**Plan:** `specs/006-revocacion-sesiones-portal/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada y revisada
- [x] Plan con Contratos + Mitigación completado

### Backend

- [x] `deactivatePortalClient`: `revokeRefreshTokens(uid)` tras `disabled: true`
- [x] Manejo error revoke → `failed-precondition` sin rollback de disabled
- [x] `npm run functions:build` — exit 0
- [ ] Function desplegada — **NO** en esta entrega (pendiente autorización Luis)

### Frontend

- [x] Loading contextual «Actualizando…» al desactivar portal
- [x] Overlay `hide` en success y error
- [x] Sin cambios de routing / StaffModule

### Integración

- [x] Docs: AUDIT-CODE, domain-context deuda, ROADMAP, README specs

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask). El usuario **no** es el QA por defecto.

- [x] `npm run build` — exit 0
- [x] `npm run functions:build` — exit 0
- [x] Servidor local activo (`npm start` → http://localhost:4200) + smoke código loading
- [x] Revisión código: orden disabled → revoke; sin rollback
- [ ] Manual E2E Auth revoke — **pendiente post-deploy** (no deploy en esta entrega; requiere `firebase deploy --only functions:deactivatePortalClient` + credenciales portal)

**Resultado:** OK (builds + revisión código). E2E Auth revoke pendiente post-deploy.

```
npm run functions:build → tsc exit 0
npm run build → ng build production exit 0 (Hash: ce9ddc39eb62d1e3)
ng serve → listening on localhost:4200
```

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicada (ítems N/A marcados)
- [x] `npm run build` OK y reportado
- [x] `npm run functions:build` OK y reportado
- [x] Live preview :4200 vivo
- [x] Tabla de resultados rellenada
- [x] Loading contextual verificado en código

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** N/A
- [x] **Tipos erróneos:** N/A
- [x] **Límites / desbordamiento:** N/A
- [x] **Chips/badges de estado:** N/A

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** N/A (SweetAlert existente)
- [x] **Pickers compactos:** N/A
- [x] **Timepicker:** N/A
- [x] **Retroalimentación:** Swal éxito/error; mensaje server en failed-precondition vía `extractCallableMessage`
- [x] **Loading contextual:** `LOADING_MESSAGES.updating` («Actualizando…»)
- [x] **Loading no trabado:** `hide` en then + catch
- [x] **Doble submit:** flag `saving`

### 3. Casos límite y errores de red

- [x] **Red lenta / sin conexión:** patrón existente loading + ErrorMessagesService
- [x] **Datos nulos RTDB:** N/A Functions valida authUid

### 4. Integridad final

- [x] **`npm run build`** exit 0
- [x] **`npm run functions:build`** exit 0
- [x] **Servidor local :4200** activo
- [x] **Resultados registrados** abajo

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | N/A | Solo Functions + loading |
| Formularios — tipos erróneos | N/A | |
| Formularios — límites texto | N/A | |
| UI — chips estado completos | N/A | |
| Modales — apertura/cierre | N/A | SweetAlert existente |
| UI — diálogos --picker | N/A | |
| UI — timepicker en campos hora | N/A | |
| UI — retroalimentación | OK | Swal + mensaje callable |
| UI — loading contextual | OK | Actualizando… |
| UI — loading no trabado | OK | hide then/catch |
| UI — doble submit | OK | flag saving |
| Edge — red lenta/error | OK | patrón existente |
| Edge — datos nulos RTDB | N/A | |
| Servidor local :4200 + smoke | OK | http://localhost:4200 |
| Build `npm run build` | OK | exit 0 |
| Build `npm run functions:build` | OK | tsc exit 0 |
| Código — revoke tras disabled | OK | `functions/src/index.ts` |
| Código — sin rollback si revoke falla | OK | failed-precondition + sync/log |
| E2E Auth revoke (desactivar portal → sesión invalidada) | PENDIENTE | 2026-08-25: post-deploy; no ejecutar deploy sin autorización Luis |

```
> katzenvet@0.0.1 functions:build → tsc OK
> katzenvet@0.0.1 build → ng build production OK (Time: 5701ms)
ng serve → Angular Live Development Server is listening on localhost:4200
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: `revokeRefreshTokens` tras desactivar
- [x] SC-002: RTDB portalActivo / AuthPerfiles sin cambios destructivos
- [x] SC-003: revoke falla → error claro, disabled permanece
- [x] SC-004: loading «Actualizando…»
- [x] SC-005: overlay hide success/error

---

## Cierre

- [x] Validación pre-entrega completa
- [x] Validación exhaustiva registrada
- [x] `spec.md` estado → `done`
- [ ] Commit / deploy — solo si el usuario lo pidió
- [ ] **Pendiente:** `firebase deploy --only functions:deactivatePortalClient` con autorización Luis

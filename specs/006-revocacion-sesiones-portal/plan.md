# Plan técnico: Revocación inmediata de sesiones al desactivar portal

**Spec:** `specs/006-revocacion-sesiones-portal/spec.md`  
**Estado:** approved  

---

## Resumen

Extender `deactivatePortalClient` para llamar `admin.auth().revokeRefreshTokens(uid)` **después** de `disabled: true` y de los updates RTDB existentes. Si el revoke falla, **no** se hace rollback: la cuenta queda deshabilitada y se reporta error claro al admin. En UI, usar loading contextual «Actualizando…» al desactivar.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/usuarios/usuarios.component.ts` | modificar | `loadingService.show(LOADING_MESSAGES.updating)` en desactivar portal |
| `src/app/core/error-messages.service.ts` | revisar | contexto `desactivar portal cliente` ya existe |

### Firebase

| Archivo | Acción |
|---------|--------|
| `functions/src/index.ts` | `revokeRefreshTokens` en `deactivatePortalClient` |

### Specs / docs

| Archivo | Acción |
|---------|--------|
| `specs/006-revocacion-sesiones-portal/*` | crear |
| `specs/AUDIT-CODE.md` | marcar ítem 3 resuelto / parcial→hecho |
| `specs/memory/domain-context.md` | actualizar deuda §9 / backlog |
| `specs/ROADMAP.md` | tachar prioridad revoke |
| `specs/README.md` | listar 006 |

### Cypress

| Archivo | Acción |
|---------|--------|
| — | no aplica (sin ruta nueva) |

---

## Modelo de datos

Sin campos RTDB nuevos. Flujo Auth:

```text
deactivatePortalClient(clienteId)
  → Cliente.portalActivo = false (+ audit fields)
  → AuthPerfiles.activo = false
  → Auth.updateUser(uid, { disabled: true })
  → Auth.revokeRefreshTokens(uid)   # NUEVO
  → syncClaimsForUid(uid)
  → PortalProvisionLog push
```

---

## Flujos

### Flujo principal

1. Admin confirma «Desactivar portal» en `/admin/usuarios`.
2. UI muestra overlay «Actualizando…» y llama callable.
3. Function valida admin + `authUid`.
4. Updates RTDB + `disabled: true`.
5. `revokeRefreshTokens(uid)`.
6. Sync claims + audit log.
7. Respuesta éxito → SweetAlert + refresco lista.

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Sin sesión | unauthenticated |
| No admin | permission-denied |
| Sin `authUid` | failed-precondition — «Este cliente no tiene cuenta de portal.» |
| `revokeRefreshTokens` falla tras disabled | failed-precondition — mensaje claro; cuenta **permanece** deshabilitada |
| Auth user-not-found en updateUser | se ignora (comportamiento actual); revoke no aplica si no hay uid Auth |

### Política revoke falla (obligatoria)

1. Orden: RTDB → `disabled: true` → **revoke** → claims → log.
2. Si revoke lanza: log server-side del error; lanzar `HttpsError('failed-precondition', '…')` indicando que el acceso quedó bloqueado pero la revocación de tokens falló (reintentar / contactar soporte).
3. **No** re-habilitar Auth ni revertir `portalActivo` (preferencia seguridad: mejor bloqueado sin revoke limpio que sesión activa con portal “activo” en UI inconsistente).

---

## Servicios

- `FirebaseFunctionsService.deactivatePortalClient()` — sin cambio de firma
- `LoadingService` + `LOADING_MESSAGES.updating`

---

## UI (admin)

- Sin layout nuevo; solo mensaje de loading en acción existente
- Contenedor: `.usuarios-contenedor` (existente)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** solo escrituras ya existentes; sin nodos nuevos; app móvil no afectada.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Cliente.portalActivo` | update false | no — gate portal ya existente | |
  | `Katzen/AuthPerfiles.activo` | update false | no | |
  | Firebase Auth tokens | revoke | sí (seguridad deseada) | Admin SDK |
  | `PortalProvisionLog.revokeRefreshTokensFailed?` | opcional en fallo | no | solo si revoke falla |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales — N/A (ninguno)

- **Estrategia de Datos de Prueba:** mocks locales / emuladores; prohibido producción `katzen-a0e3e`.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Confirmación / éxito | SweetAlert2 en `usuarios.component.ts` |
  | Loading async | `LoadingService` + `LOADING_MESSAGES` (spec 005) |
  | Errores | `ErrorMessagesService` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado (loading §)
  - [x] Chips/badges — N/A esta entrega

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build` + `npm run functions:build`).
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Function en producción con bug post-deploy | Redeploy versión anterior de `deactivatePortalClient` (solo con autorización Luis) |
| Revoke falla en runtime | Cuenta queda `disabled`; admin ve error; reintentar desactivar o revoke manual Admin SDK |
| UI loading incorrecto | Revertir cambio en `usuarios.component.ts` |
| Build Angular/Functions falla | Revertir diff de la feature |

---

## Deploy

```bash
npm run functions:build
npm run build
# Solo con autorización explícita de Luis:
firebase deploy --only functions:deactivatePortalClient
```

**Pendiente producción:** deploy de la function; sin deploy hosting obligatorio (cambio UI mínimo).

---

## Riesgos

- Tokens ID ya emitidos siguen válidos hasta `exp` del JWT (típicamente ~1h); `revokeRefreshTokens` invalida refresh y fuerza re-auth en el próximo refresh — comportamiento Firebase estándar. Documentar para el equipo.
- Emulador Auth puede no simular revoke igual que producción; validación plena post-deploy.

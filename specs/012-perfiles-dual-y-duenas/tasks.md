# Tasks: Perfiles duales y dueñas operativas

**Spec:** `specs/012-perfiles-dual-y-duenas/spec.md`  
**Plan:** `specs/012-perfiles-dual-y-duenas/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan aprobado

### Backend

- [x] Callable `linkStaffPortalCliente`
- [x] Map `super_admin` / `dueno` en functions (parity)
- [x] `npm run functions:build`
- [x] Deploy `functions:linkStaffPortalCliente`

### Frontend / docs

- [x] Matriz en `domain-context.md`
- [x] `staff-role.config.ts` super_admin
- [x] Selector `/auth/contexto`
- [x] Login admin/portal → dual
- [x] Guards sin bucles
- [x] Atajos admin ↔ portal
- [x] UI vincular dual + naming Personal
- [x] Índice specs README + notas 008/011

### Integración

- [x] Convive con claims dual existentes (admin Cypress es dual)

---

## Testing

> **Quién ejecuta:** el agente.

- [x] `npm run build` — exit 0
- [x] `npm run functions:build`
- [x] Servidor local :4200 + smoke
- [x] `npm run cy:admin` — 23/23 PASS (helper dual → Panel admin)
- [x] Smoke dual: login admin llega a `/auth/contexto` (evidencia Cypress)

**Resultado:** OK

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicada (§ aplicables)
- [x] `npm run build` OK
- [x] Live preview :4200
- [x] Tabla resultados
- [x] UI recientes N/A (no chips/timepicker nuevos críticos)

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|----------|-------|
| Formularios — campos vacíos | OK | diálogo vincular exige cliente |
| Formularios — tipos erróneos | N/A | |
| Formularios — límites texto | N/A | |
| UI — chips estado completos | OK | badge Dual |
| Modales — apertura/cierre | OK | vincular shell |
| UI — diálogos --picker | OK | vincular usa --picker |
| UI — timepicker | N/A | |
| UI — retroalimentación | OK | Swal éxito/error |
| UI — loading contextual | OK | Actualizando… |
| UI — loading no trabado | OK | hide en finally |
| UI — doble submit | OK | saving / choosing flags |
| Edge — red/error | OK | ErrorMessagesService |
| Edge — datos nulos | OK | dual map vacío |
| Servidor local :4200 + smoke | OK | proceso |
| Build `npm run build` | OK | exit 0 · 2026-08-26 |
| cy:admin | OK | 23/23 |
| UI — shells auth/portal centrados | OK | Fix `/auth/contexto`: incluye `auth.component.css`; card V+H centrada |
| Diseño responsivo contexto | OK | full-width + padding móvil; botones apilados |

### Hotfix UI — `/auth/contexto` (2026-08-26)

- **Antes:** card pegada arriba-izquierda (clases `admin-auth-*` sin CSS por encapsulación).
- **Después:** mismo shell que login admin (centrado, fondo teal, card 440px).
- **Docs:** constitution, ADMIN-UI, admin-ui-architecture.mdc, qa-validation-guide, spec 012.
- [x] `npm run build`
- [x] Live preview :4200
- [x] Commit + push + `firebase deploy --only hosting` (autorizado)

```
npm run build → exit 0
npm run functions:build → exit 0
npm run cy:admin → 23/23 PASS
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-009

---

## Cierre

- [x] Validación pre-entrega completa
- [x] `spec.md` → done
- [x] Commit + push (pedido por Luis)
- [x] Hotfix layout contexto + hosting (2026-08-26)
- [x] Hotfix aislamiento entrada portal (2026-08-27): login landing/`/portal/login` → solo portal; lock bloquea `/admin` y oculta atajo admin; selector dual solo tras `/admin/login`

### Hotfix login — 504 que el navegador llama CORS (2026-10-21)

- **Causa:** incidente de Firebase Realtime Database en us-central1 (500 y latencia; el WebSocket a firebaseio.com se cae). `syncMyClaims` esperaba esa lectura hasta el tope de Cloud Run (60s). El gateway responde **504 sin `Access-Control-Allow-Origin`** y Chrome lo muestra como CORS (`ERR_FAILED`). El preflight OPTIONS ya era 204.
- **Qué provocamos:** el deploy con lista `cors` dejó pasar el POST (antes el preflight moría en 400). La lista no era el 504; el cuelgue contra RTDB sí.
- **Código:** `cors: true` y tope interno de 5s en la lectura RTDB/Auth (`callable-deadline.util.ts`). Si la base no contesta, la función devuelve `unavailable` (503) con CORS. Timeout de la callable: 20s.
- **Dónde vive:** `functions/src/index.ts` (`syncMyClaims`), `functions/src/callable-deadline.util.ts`.
- **Deploy (2026-10-21, outage):** `firebase deploy --only functions:syncMyClaims`. Sin commit, sin rules, sin escritura RTDB.

Luis: recarga forzada. El login no debe quedarse un minuto en un falso CORS. Los datos de la base siguen dependiendo de que Firebase restablezca RTDB (`https://status.firebase.google.com/`).
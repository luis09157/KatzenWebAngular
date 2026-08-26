# Tasks: Registro portal cliente (admin + landing)

**Spec:** `specs/013-registro-portal-cliente-landing/spec.md`  
**Plan:** `specs/013-registro-portal-cliente-landing/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan con Contratos + Mitigación

### Backend

- [x] Reglas RTDB `PortalRegistroRate`
- [x] Cloud Function `registerPortalOwner`
- [x] `provisionPortalClient` ampliado a staff clínico
- [x] `npm run functions:build` — exit 0
- [x] Function desplegada (ver cierre / reporte)

### Frontend

- [x] Auto-provision en `clientes.component` post-alta
- [x] `FirebaseFunctionsService.registerPortalOwner`
- [x] ErrorMessagesService contexto
- [x] Landing form registro + modal
- [x] UI «Borrar» / loading contextual verificados

### Integración

- [x] Docs: README, domain-context, ROADMAP, AUDIT
- [x] Compatibilidad aditiva verificada

---

## Testing

- [x] `npm run build` — exit 0 (2026-08-26; warning budget tamaño, sin errores)
- [x] `npm run functions:build` — exit 0
- [x] Servidor local :4200 vivo
- [x] Cypress smoke landing (admin-smoke 4/4 PASS)

**Resultado:** build OK; deploy functions+database+hosting OK; Cypress PASS

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicada (formularios/modales/loading aplicables)
- [x] `npm run build` OK
- [x] Live preview :4200 vivo
- [x] Tabla de resultados rellenada
- [x] Loading «Guardando…»; copy Borrar en clientes OK

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | registerForm required + acceptPrivacy |
| Formularios — tipos erróneos | OK | email/tel validators |
| Formularios — límites texto | OK | maxLength en form |
| UI — chips estado completos | N/A | no tocado |
| Modales — apertura/cierre | OK | login + register landing |
| UI — diálogos --picker | N/A | |
| UI — timepicker | N/A | |
| UI — retroalimentación | OK | Swal éxito/error/warning Resend |
| UI — loading contextual | OK | Guardando… en alta cliente |
| UI — loading no trabado | OK | un show / un hide |
| UI — doble submit | OK | isRegistering / saving |
| Edge — sin Resend self | OK | CF failed-precondition temprano |
| Edge — datos nulos RTDB | OK | aditivo |
| Servidor local :4200 + smoke | OK | proceso en :4200 |
| Build `npm run build` | PASS | exit 0 |
| Functions build | PASS | exit 0 |

```
npm run build → exit 0 (budget warning 2.01 MB)
npm run functions:build → exit 0
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-011 (ver spec.md)

---

## Cierre

- [x] Validación pre-entrega registrada
- [x] `spec.md` → `done`
- [x] Commit / push / deploy (functions + database + hosting)

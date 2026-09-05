# Tasks: Fase 4 — Hoy, roles y onboarding

**Spec:** `specs/072-fase4-hoy-roles-onboarding/spec.md`  
**Plan:** `specs/072-fase4-hoy-roles-onboarding/plan.md`  
**Nivel de cambio:** L3

---

## Implementación

### Setup

- [x] Carpeta spec creada y alcance confirmado
- [x] Plan con Contratos de Datos / Rollback

### Backend

- [x] Reglas RTDB — aditivas (`Config/clinica` write admin)
- [x] Cloud Function — N/A
- [x] Deploy documentado (Luis autoriza; **no** ejecutado)

### Frontend

- [x] `staff-role.config` ACCESS + compacto doctor + módulo `configuracion`
- [x] `StaffRoleGuard` mensaje humano
- [x] Menú 6 grupos + Ayuda
- [x] Dashboard Hoy por rol
- [x] Indicador recordatorios en ficha cliente
- [x] Módulo `/admin/configuracion` + `ClinicConfigService`
- [x] Ticket/WhatsApp leen nombre de clínica
- [x] `app-flow-hint` dismiss localStorage
- [x] `docs/MANUAL-USUARIO.md` + diálogo Ayuda

---

## Validación

> L3: guía `specs/templates/qa-validation-guide.md`. Sin deploy. Emulador RTDB; Auth de `ng serve` sigue en Firebase real (no se usó prod ni el seed de Auth).

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | OK | exit 0 · Hash `4fb464ffa50778af` · warning budget 2.50 MB preexistente |
| Unit tests del util/servicio | OK | subset 072: **21/21** · `npm run test:ci` **402 SUCCESS** exit 0 |
| `npm run lint` | OK | **0 errors** (`ng lint --quiet`) |
| Smoke local 375 / 1280 | parcial | login 375/1280 en `/tmp/kz-072/` · menú/Hoy/config/Ayuda requieren sesión staff; Auth no apunta al emulador (seed `recepcion@katzen.test` no se usó contra prod) |
| RTDB aditiva / compatible app móvil | OK | `Katzen/Config/clinica` hijo nuevo; no se tocan `inversionMeta`/`Vacunacion` |
| Chips + loading no trabado | OK | config usa `LoadingService` + `hide` en `finally` |

```
npm run build → exit 0 · Hash 4fb464ffa50778af
npm run test:ci → 402 SUCCESS
ng lint --quiet → All files pass linting
subset 072 → 21 SUCCESS
```

### Resultados QA — 2026-09-04

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — config vacía | OK | nombre required; defaults KatzenVet / IVA 0 |
| Formularios — IVA fuera de rango | OK | util `clampIvaPct` 0–100 |
| Guard recepción → finanzas | OK | tests ACCESS + mensaje humano |
| Guard peluquero → inventario | OK | tests |
| Owner-dash solo admin | OK | `staffRoleSeesOwnerDashboard` |
| Hint dismiss | OK | util localStorage |
| Canal recordatorios | OK | util sin jerga |
| UI — layout desktop | parcial | login 1280 OK; panel autenticado pendiente de Luis |
| Deploy database | N/A | no ejecutado |

---

## Criterios spec (SC-xxx)

- [x] SC-001: menú 6 grupos
- [x] SC-002: compacto doctor
- [x] SC-003: owner-dash solo admin
- [x] SC-004: bloques Hoy operativos
- [x] SC-005: ACCESS por rol
- [x] SC-006: guard + mensaje
- [x] SC-007: indicador ficha cliente
- [x] SC-008: config clínica RTDB
- [x] SC-009: manual + Ayuda
- [x] SC-010: hint dismiss localStorage

---

## Cierre

- [x] Validación del nivel registrada arriba (smoke autenticado pendiente de Luis)
- [x] Fase 4 marcada en PLAN-UX; #3 y #4 cerrados en 054
- [x] `node scripts/specs-index.mjs`
- [ ] Commit / deploy — solo si Luis lo pidió

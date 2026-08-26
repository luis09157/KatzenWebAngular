# Tasks: Permisos RTDB granulares

**Spec:** `specs/008-rtdb-permisos-granulares/spec.md`  
**Plan:** `specs/008-rtdb-permisos-granulares/plan.md`  
**Smoke roles:** `specs/008-rtdb-permisos-granulares/smoke-roles-checklist.md`

---

## Implementación

- [x] Spec/plan creados
- [x] `database.rules.json` actualizado (writes por rol + fallback)
- [x] Index aditivo `cliente_id` en Mascota
- [x] `firebase deploy --only database` — **OK 2026-08-26** (fix sintaxis: `staffRole == null`; smoke por roles sigue recomendado)
- [x] Checklist smoke post-deploy por rol — `smoke-roles-checklist.md` (2026-08-25/26)

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA: N/A UI; validación sintaxis JSON rules (2026-08-26)
- [x] `npm run build` — exit 0 (2026-08-26T05:07Z)
- [x] `npm run functions:build` — exit 0 (tsc OK; rules no requieren functions)
- [x] Live preview :4200 vivo (2026-08-26; HTTP 200)
- [x] Deploy database ejecutado 2026-08-26 — éxito (rules en prod)
- [ ] Rules unit tests / emulador RTDB — **no existen en repo**
- [x] Smoke admin post-deploy (Cypress + `cypress.env.json`) — **PASS 2026-08-26** (ver tabla)
- [ ] Smoke manual por roles restantes (doctor / recepcionista / peluquero / portal / sin staffRole) — **pendiente** (requiere usuarios)
- [x] Comparación rules locales vs prod — alineadas tras deploy 2026-08-26 (mismo `database.rules.json` liberado)
- [x] Unit portal-mapper (`notas_internas` / `oculto_portal`) — **8/8 PASS** 2026-08-26

### Tabla de resultados (smoke 2026-08-25/26)

| Ítem | Resultado | Notas |
|------|-----------|-------|
| JSON rules válido | OK 2026-08-26 | |
| Matriz roles documentada | OK | plan.md + smoke-roles-checklist.md |
| Fallback sin staffRole | Documentado / en rules | smoke E pendiente |
| Deploy database | **OK** 2026-08-26 | |
| Localhost :4200 | **OK** | LISTEN + HTTP 200 |
| Admin A1.* Citas R/W UI | **PASS** | Cypress admin-modules |
| Admin A1.* Historiales R/W UI + notas_internas | **PASS** | admin-features-008-010-smoke |
| Admin A1.* Inventario lectura UI | **PASS** | productos + movimientos |
| Admin A1.* Baños diálogo | **PASS** | banios-flujos |
| Admin A1.* Vacunas / Recordatorios | **PASS** | módulos autenticados |
| Cypress suite 008-related | **PASS** 23/23 | modules + 008-010 + smoke + banios |
| Unit notas_internas portal | **PASS** 8/8 | dueño no ve (mapper) |
| Doctor A2.* | **PENDIENTE** | requiere usuario doctor |
| Recepcionista B.* | **PENDIENTE** | requiere usuario recepcionista |
| Peluquero C.* | **PENDIENTE** | requiere usuario peluquero |
| Portal D.1–D.3 E2E | **PENDIENTE** | requiere usuario portal |
| Staff legacy E.* | **PENDIENTE** | requiere usuario sin staffRole |
| Rules unit tests | No existen | pendiente |

### Plan de prueba manual post-deploy

Ver `smoke-roles-checklist.md` (checklist completo con `- [ ]` y columna Resultado).

1. Emulador o staging: admin write historial OK; recepcionista DENIED; peluquero baño OK / inventario DENIED.
2. Token sin `staffRole`: write legacy OK (fallback).
3. Portal client: lectura propia OK; write clínico DENIED.
4. Tras deploy autorizado: smoke app móvil staff.

---

## Resultado build / smoke (re-validación 2026-08-26)

```
npm run build → exit 0 (previo)
Cypress (admin-modules + 008-010 + admin-smoke + banios) → 23/23 PASS
ng test portal-mapper.util.spec.ts → 8/8 PASS
:4200 → vivo
```

Smoke multi-rol completo **sigue pendiente** de credenciales doctor / recepcionista / peluquero / portal / legacy.

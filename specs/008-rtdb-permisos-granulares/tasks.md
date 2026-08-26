# Tasks: Permisos RTDB granulares

**Spec:** `specs/008-rtdb-permisos-granulares/spec.md`  
**Plan:** `specs/008-rtdb-permisos-granulares/plan.md`  

---

## Implementación

- [x] Spec/plan creados
- [x] `database.rules.json` actualizado (writes por rol + fallback)
- [x] Index aditivo `cliente_id` en Mascota
- [x] `firebase deploy --only database` — **OK 2026-08-26** (fix sintaxis: `staffRole == null`; smoke por roles sigue recomendado)

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA: N/A UI; validación sintaxis JSON rules (2026-08-26)
- [x] `npm run build` — exit 0 (2026-08-26T05:07Z)
- [x] `npm run functions:build` — exit 0 (tsc OK; rules no requieren functions)
- [x] Live preview :4200 vivo (sin cambio UI en esta feature)
- [x] Deploy database ejecutado 2026-08-26 — éxito (rules en prod)
- [ ] Rules unit tests / emulador RTDB — **no existen en repo**
- [ ] Smoke manual post-deploy por rol (admin / recepcionista / peluquero / portal / sin staffRole) — **pendiente** (requiere rules en prod o emulador)
- [x] Comparación rules locales vs prod — alineadas tras deploy 2026-08-26 (mismo `database.rules.json` liberado)

### Tabla de resultados

| Ítem | Resultado |
|------|-----------|
| JSON rules válido (`python3`/`node` parse) | OK 2026-08-26 |
| Matriz roles documentada | OK en plan.md |
| Fallback sin staffRole | Documentado / implementado en repo |
| Rules unit tests | No existen — pendiente |
| Deploy database | **OK** 2026-08-26 (`firebase deploy --only database`) |
| Diff local vs HEAD | Sin cambios pendientes en working tree al validar |
| Cypress/E2E rules | N/A (no UI) |

### Plan de prueba manual post-deploy

Ver `plan.md` § Plan de prueba. **Obligatorio antes de declarar 008 funcional al 100%:**

1. Emulador o staging: admin write historial OK; recepcionista DENIED; peluquero baño OK / inventario DENIED.
2. Token sin `staffRole`: write legacy OK (fallback).
3. Portal client: lectura propia OK; write clínico DENIED.
4. Tras deploy autorizado: smoke app móvil staff.

---

## Resultado build (re-validación 2026-08-26)

```
npm run build → exit 0
npm run functions:build → exit 0
```

Deploy database: **OK** 2026-08-26. Smoke manual por roles (admin / recepcionista / peluquero / portal / sin staffRole) **sigue recomendado** antes de declarar 008 al 100%.

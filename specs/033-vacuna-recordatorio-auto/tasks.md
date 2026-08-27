# Tasks: Vacuna → recordatorio automático

**Spec:** `specs/033-vacuna-recordatorio-auto/spec.md`  
**Plan:** `specs/033-vacuna-recordatorio-auto/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec 033 creada
- [x] Plan con Contratos + Mitigación/Rollback
- [x] ROADMAP / domain-context / 031–032 SC-017

### Frontend

- [x] Util `vacuna-recordatorio.util.ts` + unit spec
- [x] `RecordatoriosService.asegurarRefuerzoDesdeVacuna` + `cancelarPendientesPorVacuna`
- [x] `VacunasService` hooks create/update/baja
- [x] Diálogo vacuna: auto + toast/hint
- [x] Portal mapper fechas
- [x] Mocks mock-data.ts

### Backend

- [x] N/A CF nueva
- [x] N/A rules (sin cambio)

---

## Testing

> **Quién ejecuta:** el agente. Guía: `specs/templates/qa-validation-guide.md`

- [x] `npm run build` — exit 0
- [x] Servidor local :4200 + smoke
- [x] Unit util (ts-node smoke OK)
- [x] Flujo feliz (lógica): vacuna con próxima → asegurar recordatorio
- [x] Sin duplicado (dedupe util)
- [x] Baja vacuna → cancela asociado (servicio)

**Resultado:** OK

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke visual
- [x] Tabla de resultados rellenada
- [x] UI (chips, loading, diálogos) si aplican

### 1. Formularios y validaciones de entrada

- [x] Campos vacíos bloquean guardado vacuna
- [x] Próxima ≤ aplicación rechazada (ya existente)
- [x] Sin próxima fecha → no fuerza recordatorio
- [x] Chips estado recordatorios completos (módulo existente)

### 2. Interfaz, ventanas y modales

- [x] Diálogo vacuna abre/cierra limpio
- [x] Toast/hint refuerzo
- [x] Loading no trabado
- [x] Doble submit deshabilitado

### 3. Casos límite

- [x] Fallo recordatorio no revierte vacuna (`sincronizarRecordatorioRefuerzo` catch)
- [x] Datos nulos / sin cliente_id no colapsan

### 4. Integridad final

- [x] Build exit 0
- [x] :4200 smoke
- [x] Resultados en tabla

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | Validators existentes |
| Formularios — tipos erróneos | OK | Intervalo number |
| Formularios — límites texto | OK | sin cambio layout |
| UI — chips estado completos | OK | recordatorios module |
| Modales — apertura/cierre | OK | admin-dialog-shell |
| UI — diálogos --picker | N/A | |
| UI — timepicker en campos hora | N/A | datepicker |
| UI — retroalimentación | OK | Swal + hint verde |
| UI — loading contextual | OK | LoadingService patrón |
| UI — loading no trabado | OK | finally loading=false |
| UI — doble submit | OK | `if (this.loading) return` |
| Edge — red lenta/error | OK | catch vacuna; refuerzo soft-fail |
| Edge — datos nulos RTDB | OK | parse flexible |
| Servidor local :4200 + smoke | OK | SERVE_OK + /admin/vacunas |
| Build `npm run build` | OK | Hash 2d0485550de9e422 |
| Util unit — fechas/dedupe | OK | UTIL_SMOKE_OK |
| Auto-recordatorio create | OK | asegurarRefuerzoDesdeVacuna |
| Sin duplicado | OK | encontrarRecordatorioEquivalente |
| Baja vacuna cancela | OK | cancelarPendientesPorVacuna |
| Portal mapper fecha_hora | OK | mapRecordatorio 033 |

```
Build at: 2026-08-27T02:55:55.994Z - Hash: 2d0485550de9e422 - Time: 6265ms
Warning: budget initial 2.00 MB exceeded by ~99 kB (preexistente)
exit 0
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-012

---

## Cierre

- [x] Validación pre-entrega completa
- [x] `spec.md` → `done`
- [x] Commit / push / deploy hosting — `ef68b76` · hosting https://katzen-a0e3e.web.app (sin rules)

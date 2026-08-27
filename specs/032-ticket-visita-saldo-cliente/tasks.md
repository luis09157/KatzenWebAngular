# Tasks: Ticket visita + saldo cliente

**Spec:** `specs/032-ticket-visita-saldo-cliente/spec.md`  
**Plan:** `specs/032-ticket-visita-saldo-cliente/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec 032 creada
- [x] Plan con contratos + mitigación

### Backend

- [x] Reglas RTDB `Katzen/Visitas` (staff + client read propia)
- [x] Índice Caja `visitaId` / `clienteId`
- [x] Sin Cloud Functions nuevas
- [x] Sin Resend

### Frontend

- [x] StaffModule `visitas` + routing + menú
- [x] Models + util + VisitasService
- [x] Lista `/admin/visitas` + KPIs
- [x] Diálogo ticket (líneas + cobrar)
- [x] Caja `visitaId`
- [x] Clientes: chip saldo + cuenta corriente
- [x] Citas/Baños: Agregar a visita
- [x] Expediente: nueva visita
- [x] Portal read-only visitas/saldo
- [x] Mocks
- [x] Cypress smoke ruta
- [x] ROADMAP / domain-context / README specs

### Integración

- [x] Convive con cobros 1:1 legacy
- [x] Anti doble cobro

---

## Testing

- [x] `npm run build` — exit 0 (2026-08-26)
- [x] Servidor local `:4200` (ng serve vivo)
- [x] Flujo lógico util: parcial/cerrada/agregación saldo (unit)
- [x] Error controlado: form sin cliente / cobro sin líneas (validación UI)
- [ ] Cypress módulo autenticado (ruta visitas) — pendiente credenciales CI si aplica

**Resultado:** OK build + unit util

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicada (§1–§4 relevantes)
- [x] `npm run build` OK
- [x] Live preview :4200 (proceso activo)
- [x] Tabla de resultados rellenada
- [x] UI chips/loading/diálogos

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|----------|-------|
| Formularios — campos vacíos | OK | cliente/fecha required; línea min monto |
| Formularios — tipos erróneos | OK | Validators.min(0.01) monto |
| Formularios — límites texto | OK | notas maxlength 500 |
| UI — chips estado completos | OK | estado-badge abierta/parcial/cerrada |
| Modales — apertura/cierre | OK | visita + cuenta + caja |
| UI — diálogos --picker | N/A | picker 029 en form |
| UI — timepicker | N/A | sin hora |
| UI — retroalimentación | OK | Swal éxito/error |
| UI — loading contextual | OK | Guardando/Eliminando |
| UI — loading no trabado | OK | finally hide |
| UI — doble submit | OK | loading disable botones |
| Edge — red/error | OK | ErrorMessagesService |
| Edge — datos nulos RTDB | OK | normalize lineas[] |
| Servidor local :4200 + smoke | OK | ng serve activo; módulo lazy build |
| Build `npm run build` | OK | exit 0; budget warn previo |

```
Build at: 2026-08-27T01:59:43.242Z - Hash: 84c132c5c41d464d - Time: 13919ms
EXIT:0
Lazy chunk visitas-visitas-module presente.
Warning: bundle initial budget (histórico, no bloqueante).
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-016
- [x] SC-017 deferred → **033** (vacuna→recordatorio)

---

## Cierre

- [x] Validación pre-entrega completa
- [x] `spec.md` → `done`
- [x] Commit + push + deploy hosting (+ database) — pedido Luis (2026-08-26)

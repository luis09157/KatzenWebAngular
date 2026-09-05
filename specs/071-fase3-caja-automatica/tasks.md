# Tasks: Fase 3 — Caja automática

**Spec:** `specs/071-fase3-caja-automatica/spec.md`  
**Plan:** `specs/071-fase3-caja-automatica/plan.md`  
**Nivel de cambio:** L3

---

## Implementación

### Setup

- [x] Carpeta spec creada y alcance confirmado
- [x] Plan con Contratos de Datos / Rollback

### Backend

- [x] Reglas RTDB — aditivas (`Caja/Turnos.indexOn`)
- [x] Cloud Function — N/A
- [x] Deploy documentado (Luis autoriza; **no** ejecutado)

### Frontend

- [x] Utils + tests: turno, folio, ticket 80 mm, corte duplicado, ventas/vet, CSV OC
- [x] `CajaService` turno implícito + anti-duplicado
- [x] Banner POS + Hoy; diálogo corte (efectivo contado principal)
- [x] Ticket `ticket-80` + folio + WhatsApp alineado
- [x] Finanzas tab Ventas hoy + CxC
- [x] Export CSV órdenes

---

## Validación

> Fuente: `specs/templates/qa-validation-guide.md` (L3). Emulador RTDB + Auth; sin prod.

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | OK | exit 0 · Hash `a432a21332ced791` · warning de budget 2.50 MB preexistente |
| Unit tests del util/servicio | OK | 28/28 utils 071 + `npm run test:ci` **385 SUCCESS** exit 0 |
| `npm run lint` | OK | **0 errors**, 543 warnings preexistentes |
| Smoke local 375 / 1280 | OK | emulador Auth+RTDB; shots `/tmp/kz-071/` |
| RTDB aditiva / compatible app móvil | OK | `Katzen/Caja/Turnos/{fecha}` + `Visitas.folio?`; no se tocan nodos móviles |
| Chips completos + loading contextual no trabado | OK | corte usa `LoadingService` + `hide` en `finally` |

### Resultados QA — 2026-09-04

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | corte: efectivo contado required; OC sin filas → «Sin datos» |
| Formularios — tipos erróneos | OK | montos `type=number` min 0 |
| Formularios — límites texto | N/A | notas corte opcionales; CSV no captura texto libre nuevo |
| UI — chips estado completos | N/A | no se cambiaron chips de tabla clínica |
| UI — nombres persona completos (desktop) | OK | columna Veterinaria `cell-nombre` sin ellipsis forzado |
| UI — celdas multi-línea (gap) | N/A | tab ventas es 1 línea por fila |
| UI — layout ancho desktop | OK | 1280 POS / Finanzas / OC |
| UI — shells auth/portal centrados | N/A | no se tocó auth/portal |
| Modales — apertura/cierre | OK | corte desde banner; Escape cierra |
| UI — diálogos --picker | N/A | no picker nuevo |
| UI — timepicker en campos hora | N/A | sin campos hora |
| UI — diálogos spec 059 | OK | `admin-dialog-shell` en corte |
| UI — páginas spec 061 | OK | Finanzas tab + paneles; OC banner existente |
| UI — copy destructivo «Borrar» | N/A | 071 no añade borrados |
| UI — retroalimentación | OK | Swal corte / Sin datos OC |
| UI — loading contextual | OK | Guardando en corte |
| UI — loading no trabado | OK | `finally` hide |
| UI — doble submit | OK | botón corte disabled si `yaHayCorte` / loading |
| Edge — red lenta/error | OK | turno en cobro va en try/catch; no bloquea ingreso |
| Edge — datos nulos RTDB | OK | sin turno/folio → defaults; utils cubren null |
| Servidor local :4200 + smoke | OK | http://localhost:4200 |
| Build `npm run build` | OK | exit 0 |

**Smoke emulador (detalle):**

- Turno sembrado `Katzen/Caja/Turnos/2026-09-04` → banner **Hacer corte** en POS y Hoy; abre diálogo con **Efectivo contado**.
- Print: `.ticket-80` en DOM (`display:none` en pantalla; `@media print` 80/72 mm).
- Finanzas tab «Ventas hoy»: lista vets + bloque CxC + CTA `?deuda=1`.
- OC: Exportar ya no dice «Próximamente».
- Shots: `/tmp/kz-071/1280-pos.png`, `1280-pos-banner.png`, `1280-pos-dialog.png`, `1280-corte-dialog.png`, `1280-finanzas-hoy.png`, `1280-ordenes.png`, `1280-dashboard-banner.png`, `375-pos.png`, `375-dashboard.png`.

```
npm run build          exit 0
npm run test:ci        385 SUCCESS
npm run lint           0 errors
utils 071              28 SUCCESS
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: primer cobro crea turno
- [x] SC-002: no segundo corte
- [x] SC-003: banner POS/Hoy
- [x] SC-004: efectivo contado principal
- [x] SC-005: ticket 80 mm + folio
- [x] SC-006: WhatsApp alineado
- [x] SC-007: ventas por veterinaria
- [x] SC-008: CxC enlace
- [x] SC-009: CSV OC

---

## Cierre

- [x] Validación del nivel registrada arriba
- [x] `spec.md` estado → `done` + `node scripts/specs-index.mjs`
- [ ] Commit / deploy — **no** pedidos; rules de database **no** desplegadas

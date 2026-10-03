# Tasks: 091 POS riel Pensión

**Nivel:** L2 · Spec `091-pos-riel-pension/spec.md`

---

## Implementación

- [x] Anti-duplicación: reutilizar `descripcionCobroPension`, ticket visita, molde cola 085/086
- [x] `pendientes-pension.util.ts` + tests
- [x] `PosRiel` + `pension`; wire `visita-dialog` chip + grid
- [x] Memoria + INDEX

---

## Código tocado / utils reutilizados

| Qué | Ruta / nota |
|-----|-------------|
| Cola pensión POS | `visitas/pendientes-pension.util.ts` |
| Rieles | `visitas/pos-rieles.util.ts` (`pension`) |
| UI | `visita-dialog.component` html/ts |
| Texto línea | **reutilizado** `pension/pension-cobro.util.ts` |
| Cobro al guardar | **reutilizado** `VisitasService` + `pensionId` |

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| Unit tests pendientes-pension + rieles + copy + demo | OK | 23 SUCCESS |
| `npm run build` | OK exit 0 | Budget initial `maximumError` 3→3.1mb (1.88kb over preexistente en working tree) |
| Smoke 375 / 1280 Nueva venta → chip Pensión | localhost :4200 up | Probar: Nueva venta → chip Pensión → dueño+mascota → tocar estancia |

### Follow-up L1/L2 UI — legibilidad panel Ticket (2026-10-02)

- Columna ticket desktop `360–440px` (`admin-dialog.scss` + `visita-dialog` SCSS); fila en stack (texto + ± abajo); tipografía 14/13px + totales 12/15px.
- `partesDescripcionLineaTicket` en `pos-copy.util.ts` (título/meta); HTML panel + sheet carrito.
- `npm run build` exit 0 · unit `pos-copy` + sheet carrito 10 SUCCESS.
- Smoke: desktop ≥1024 split legible; &lt;1024 barra sticky + sheet sin romper.

---

## Criterios spec

- [x] SC-001 … SC-004 (código); QA en fila de arriba al cerrar

---

## Memoria actualizada

- [x] `module-map.md` · `agent-guardrails.md` · INDEX

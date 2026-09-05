# Tasks: Fase 1 — Quitar fricción

**Spec:** `specs/069-fase1-quitar-friccion/spec.md`  
**Nivel de cambio:** L2

---

## Implementación

- [x] Spec 069 creada (sin plan.md)
- [x] 1.1 Historial motivo+nota; cita defaults; raza/sexo/género opcionales
- [x] 1.2 Producto alta corta + stock_inicial → stock_actual
- [x] 1.3 Jerga UI (hints, personal, dual, override, migrar solo super_admin)
- [x] 1.4 Catálogo demo OFF + CTA a productos
- [x] 1.5 Menú Pacientes único; sin Dashboard métricas
- [x] 1.6 Alertas auto (abrir + recepción) + badge; dedup via crearAlerta
- [x] 1.7 Cambio efectivo util + UI Cobrar
- [x] 1.8 ErrorMessages con acción + 3 tests

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run lint` | 0 errores | 542 warnings preexistentes |
| `npm run test:ci` | 351/351 | incl. historial, pos-pago-mixto, error-messages |
| `npm run build` | exit 0 | budget 2.61 MB preexistente |
| Smoke 1280 | OK | historial 2 req; cita 30 min; producto guardado; menú 1 Pacientes; Recibí+Cambio |
| Smoke 375 | OK | mismos flujos; `/tmp/kz-069/*.png` |
| RTDB | N/A | sin nodos nuevos; `stock_inicial` solo UI |

## Criterios spec

- [x] SC-001 … SC-010

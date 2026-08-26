# Plan técnico: Finanzas / caja MVP

**Spec:** `specs/014-finanzas-caja-mvp/spec.md`  
**Estado:** done  

---

## Resumen

Módulo admin lazy `finanzas` con movimientos en `Katzen/Caja/Movimientos`. UI según ADMIN-UI. Sin CFDI. Enlace opcional a Banios preparado en modelo.

---

## Archivos

| Área | Archivos |
|------|----------|
| Angular | `src/app/finanzas/*` |
| Config | `staff-role.config.ts`, routing, menú admin |
| RTDB | `database.rules.json` → `Katzen/Caja` |
| Cypress | `admin-crud-finanzas.cy.ts` + modules smoke |
| Mocks | `mock-data.ts` → `MOCK_CAJA_MOVIMIENTO` |

---

## Modelo

```text
Katzen/Caja/Movimientos/{id}
  tipo: 'ingreso' | 'egreso'
  monto: number
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia'
  ivaDeclarado: boolean
  concepto: string
  fecha: YYYY-MM-DD
  banioId?: string
  citaId?: string
  clienteId?: string
  sucursalId?: string
  notas?: string
  activo: boolean
  createdAt, updatedAt?, createdBy?
```

---

## Contratos de Datos y UI (Obligatorio)

- Solo aditivo; móvil no consume Caja hoy → sin impacto.
- Mocks en `mock-data.ts` para UI.
- Patrones: KPI grid, data panel, loading contextual, «Borrar».
- Montos: number MXN con 2 decimales en UI.

---

## Plan de Mitigación y Rollback

| Escenario | Rollback |
|-----------|----------|
| Rules Caja mal | revert `database.rules.json` + redeploy database |
| UI defectuosa | revert módulo `finanzas` + routing/menú + hosting |
| Datos basura E2E | soft-delete (`activo: false`); no hard delete |

---

## Deploy

```bash
firebase deploy --only database,hosting
```

Functions no requeridas para 014.

---

## Riesgos

- Doble cobro baño + caja → UI baño debe avisar si ya hay `cajaMovimientoId` (SC futuro)
- Montos float — validar ≥ 0.01 en formulario

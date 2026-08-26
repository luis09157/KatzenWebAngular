# Plan técnico: Finanzas / caja MVP

**Spec:** `specs/014-finanzas-caja-mvp/spec.md`  
**Estado:** draft  

---

## Resumen

Módulo admin lazy `finanzas` / `caja` con movimientos en `Katzen/Caja/Movimientos`. UI según ADMIN-UI. Sin CFDI. Enlaces opcionales a Banios/Citas.

---

## Archivos previstos

| Área | Archivos |
|------|----------|
| Angular | `src/app/finanzas/` module + service + dialogs |
| Config | `staff-role.config.ts`, routing, menú admin |
| RTDB | `database.rules.json` → `Katzen/Caja` |
| Cypress | smoke en `admin-modules-authenticated` |

---

## Modelo propuesto

```text
Katzen/Caja/Movimientos/{id}
  tipo: 'ingreso' | 'egreso'
  monto: number
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia'
  ivaDeclarado: boolean
  concepto: string
  fecha: ISO date
  banioId?: string
  citaId?: string
  clienteId?: string
  sucursalId?: string
  activo: boolean
  createdAt, createdBy
```

---

## Contratos de Datos y UI (Obligatorio)

- Solo aditivo; móvil no consume Caja hoy → sin impacto.
- Mocks en `mock-data.ts` para UI.
- Patrones: KPI grid, data panel, loading contextual, «Borrar».

---

## Plan de Mitigación y Rollback

| Escenario | Rollback |
|-----------|----------|
| Rules Caja mal | revert rules |
| UI | revert module + routing |

---

## Deploy (futuro)

```bash
firebase deploy --only database,hosting
```

---

## Riesgos

- Doble cobro baño + caja → UI debe avisar si ya hay `cajaMovimientoId`
- Montos en centavos vs float — preferir number MXN con 2 decimales validados

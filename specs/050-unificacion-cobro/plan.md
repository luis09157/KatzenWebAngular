# Plan técnico: Unificación de cobro

**Spec:** `specs/050-unificacion-cobro/spec.md`  
**Estado:** approved  

---

## Resumen

Ocultar cobro directo a caja desde módulos clínicos; unificar copy a ticket del día; reforzar finanzas con hint; default salida inventario → ticket. Sin tocar lógica de persistencia ni `cobro-integridad.util.ts`.

---

## Archivos a modificar

| Archivo | Acción |
|---------|--------|
| `banios/banios.component.html` | Quitar registrar en caja; copy ticket |
| `citas/citas.component.html` | Idem |
| `pension/pension.component.html` | Idem |
| `historiales/historiales.component.html` | Idem |
| `finanzas/finanzas.component.*` | Hint + botón cobro solo admin |
| `inventario/movimientos/salida-dialog.component.*` | Default visita, ocultar caja no-admin |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB:** ninguno.
- **Pruebas:** test:039, test:040, test:046 sin cambios en util specs.

---

## Plan de Mitigación y Rollback

| Escenario | Acción |
|-----------|--------|
| Staff no puede cobrar excepción | Admin usa finanzas |
| Tests fallan | Revertir HTML salida-dialog |

- [ ] `npm run build` OK

---

## Deploy

```bash
npm run build
npm run test:039 && npm run test:040 && npm run test:046
```

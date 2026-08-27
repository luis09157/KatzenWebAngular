# Tasks: Picker unificado de producto (044)

**Spec:** `specs/044-producto-picker/spec.md`  
**Plan:** `specs/044-producto-picker/plan.md`

## Implementación

- [x] Util `filtrarProductos` + etiqueta + tests
- [x] `app-producto-picker` en SharedModule
- [x] Entrada / salida / ajuste
- [x] Líneas de orden de compra (FormArray)
- [x] Prefill `producto_id` (salida pensión / OC stock bajo)
- [x] Cypress smoke merma: selector `[data-cy="producto-picker"]`

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicable (§1–§2 formularios/modales)
- [x] `npm run build` exit 0
- [x] Live preview `:4200` (ng serve compile inventario)
- [x] Tabla rellenada

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | `npm run test:044` — 6 SUCCESS | OK |
| 2 | `npm run build` — exit 0 | OK |
| 3 | Servidor http://localhost:4200 | OK |
| 4 | Filtro nombre / código exacto / marca (unit) | OK |
| 5 | Diálogos: picker reemplaza autocomplete local | OK (código) |
| 6 | Prefill producto_id restaura etiqueta | OK (código restaurarSeleccion) |
| 7 | Smoke autenticado merma/entrada | Bloqueado Auth prod (constitución) |

### 1. Formularios

- [x] Sin producto: `producto_id` required; no guarda
- [x] Escribir sin elegir limpia `producto_id`
- [x] Botón X limpia selección

### 2. Modales

- [x] `admin-dialog-shell` intacto
- [x] OC compacto en grid de líneas

## Entrega

- [x] spec.md → done

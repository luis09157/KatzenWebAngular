# Plan: Picker unificado de producto (044)

## Contratos de Datos y UI (Obligatorio)

| Pieza | Contrato |
|-------|----------|
| RTDB | Lectura `Katzen/Inventario/Productos` — **sin escritura nueva** |
| UI | `app-producto-picker` (FormGroup padre + `producto_id`) |
| Filtro | `filtrarProductos` / `getProductoDisplayLabel` en `producto-search.util.ts` |
| Consumidores | entrada, salida, ajuste, `orden-dialog` (FormArray por línea) |
| Prefill | `producto_id` en el form → el picker restaura etiqueta y emite `selectionChange` |

## Archivos

- `src/app/core/utils/producto-search.util.ts` (+ spec)
- `src/app/shared/admin/producto-picker.models.ts`
- `src/app/shared/admin/producto-picker.component.{ts,html,scss}`
- `shared.module.ts` declare/export
- Diálogos inventario (quitar autocomplete duplicado)

## Plan de Mitigación y Rollback

Revertir commit 044. Los diálogos vuelven al autocomplete local. No hay migración de datos. App móvil no se toca.

# Plan: Venta inventario → ticket (042)

## Contratos de Datos y UI (Obligatorio)

| Entidad | Campo | Tipo | UI |
|---------|-------|------|-----|
| Movimiento inventario | `visitaId?` | string | Set al agregar a ticket |
| Movimiento inventario | `cajaMovimientoId?` | string | Al cerrar ticket (propagación) |
| Línea visita | `movimientoInventarioId`, `productoId` | string | Categoría `venta_producto` |
| Salida dialog | `destinoCobro` | caja \| visita | Radio en venta directa |

Campos RTDB aditivos; compatibles con app móvil.

## Plan de Mitigación y Rollback

Revertir commit 042; ventas vuelven a flujo caja-only. `visitaId` opcional en movimientos no rompe lecturas legacy.

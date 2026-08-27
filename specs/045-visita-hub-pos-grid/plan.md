# Plan: Visita hub + grid productos (045)

## Contratos de Datos y UI (Obligatorio)

| Entidad | Campo | UI |
|---------|-------|-----|
| Banio | `visitaId?` | Prompt post-alta + incluir desde ticket |
| VisitaLinea | `banioId?` `productoId?` `cantidad?` `movimientoInventarioId?` | Líneas del ticket |
| Movimiento | `visitaId?` | Salida al persistir venta desde ticket |
| Producto | `imagen_url?` | Grid catálogo |

Lectura `Katzen/Banios` y `Katzen/Inventario/Productos`. Escritura aditiva. No tocar `Katzen/Producto` móvil.

## Archivos

- `src/app/visitas/pendientes-visita.util.ts` (+ spec)
- `visita-dialog` — panel pendientes + picker producto
- `banios.component` — prompt ticket tras crear
- `banio-dialog` — `close({ id })` al crear
- `productos.component` — vista lista/grid
- `inventario.service.registrarSalida` — `visitaId?` opcional

## UX (ver también 046)

- Título diálogo: preferir **“Cuenta del día”** / subtítulo que explique “Agrupa cobros del día”.
- Empty lines + pendientes + picker producto con hints (no solo validación roja).
- Walk-in sin cliente: **046**, no bloquear esta entrega.

## Plan de Mitigación y Rollback

Revertir 045. Tickets y baños legacy sin `visitaId` siguen cobrándose como hoy. Grid es solo UI. Salida de stock solo si el staff agregó producto al ticket y hay unidades.

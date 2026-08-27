# Plan: Imagen y QR de producto (043)

## Contratos de Datos y UI (Obligatorio)

| Entidad | Campo / path | Tipo | UI |
|---------|--------------|------|-----|
| Producto RTDB | `imagen_url?` | string (download URL) | Preview en diálogo + miniatura tabla. Opcional. |
| Producto RTDB | `codigo_barras` | string único | Autogenerado `KZ-{CAT}-{aammdd}-{rand}` o EAN de fábrica |
| Producto RTDB | `categoria` | enum + `vacuna` | Select con etiquetas en español |
| Producto RTDB | `unidad_medida` | enum + `tableta` `capsula` `frasco` `dosis` | Select |
| Producto RTDB | `marca` | string | Opcional; default persistido `S/M` |
| QR | implícito = `codigo_barras` | no se guarda PNG | Preview en diálogo + imprimir etiqueta |
| Storage | `Inventario/Productos/{productoId}/{file}` | image/* ≤ 5 MB | Aditivo en `storage.rules` |

Nodo: `Katzen/Inventario/Productos/{id}` — **aditivo**. No tocar `Katzen/Producto` ni `Katzen/Productos` (app móvil).

Alta con foto: `crearProducto` → upload Storage con `id` → `actualizarProducto({ imagen_url })`.

## Archivos

- `src/app/inventario/productos/producto-identificacion.util.ts` (+ spec)
- `producto-dialog.component.{ts,html,css}`
- `productos.component.{ts,html,css}`
- `src/app/shared/inventario.models.ts`
- `storage.rules`
- `precio-margen.util.ts` (IVA vacuna)

## Plan de Mitigación y Rollback

1. Revertir commit 043. Productos sin `imagen_url` siguen válidos.
2. Storage rules nuevas no afectan `Mascotas/` ni `Clientes/`.
3. Unidades/categoría nuevas son aditivas; stock legacy no se migra.
4. Dependencia `qrcode` solo en el cliente (etiqueta); si se quita, el código de barras sigue funcionando.
5. Deploy Storage **no** se ejecuta sin autorización de Luis. Hasta entonces, la foto falla con mensaje claro en localhost si las rules de prod no incluyen el path (el alta del producto no se pierde).

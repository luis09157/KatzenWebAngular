# Tasks: Imagen y QR de producto (043)

**Spec:** `specs/043-producto-imagen-qr/spec.md`  
**Plan:** `specs/043-producto-imagen-qr/plan.md`

## Implementación

- [x] Util código interno + presets categoría + QR/impresión
- [x] Foto opcional (Storage) en `producto-dialog` (patrón cliente/paciente)
- [x] QR + imprimir etiqueta (diálogo y listado)
- [x] Miniatura y acción QR en listado
- [x] Categoría `vacuna` + unidades tableta/cápsula/frasco/dosis
- [x] `storage.rules` path `Inventario/Productos/{id}/…`
- [x] IVA vacuna = medicamento (tasa 0 sugerida)

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicada (§1–§4 aplicables)
- [x] `npm run build` OK (exit 0; warning budget bundle preexistente)
- [x] Live preview `:4200` vivo + compile inventario OK
- [x] Tabla de resultados rellenada
- [x] UI: layout foto+QR (`admin-dialog-layout`), loading contextual al guardar

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | `npm run test:043` — 22 SUCCESS | OK |
| 2 | `npm run build` — exit 0 | OK |
| 3 | Servidor `http://localhost:4200` HTTP 200 + compile inventario | OK |
| 4 | Formulario: código auto + presets por categoría (util + diálogo) | OK (código + tests) |
| 5 | Foto opcional no bloquea alta; fallo Storage → warning, producto queda | OK (código) |
| 6 | QR data URL desde `codigo_barras` | OK (test unitario) |
| 7 | Smoke visual autenticado del diálogo | Bloqueado: login admin toca Auth/RTDB prod — no ejecutado por constitución |
| 8 | Deploy Storage rules | Pendiente autorización Luis (`firebase deploy --only storage`) |

### 1. Formularios

- [x] Campos vacíos: nombre/presentación/proveedor/precios siguen requeridos; marca opcional → `S/M`
- [x] Código mínimo 3 chars; regenerar con autorenew
- [x] Categoría cambia unidad/presentación/refrigeración solo si el valor sigue siendo el preset anterior (alta)

### 2. Modales / UI

- [x] `admin-dialog-shell` + aside foto (mismo patrón clientes/pacientes)
- [x] QR preview + Imprimir QR
- [x] Loading `Guardando…` / `Actualizando…` con `hide` en `finally`
- [x] Miniatura 36px en tabla; acción `qr_code_2`

### 3. Datos / compatibilidad

- [x] RTDB aditivo (`imagen_url?`, enums nuevos)
- [x] No toca `Katzen/Producto` / `Katzen/Productos` (móvil)
- [x] Storage path aditivo documentado; deploy rules pendiente

## Entrega

- [x] spec.md → done (tras QA registrada)

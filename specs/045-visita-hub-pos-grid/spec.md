# Spec: Visita del día como ticket único + catálogo en cuadrícula

**ID:** 045-visita-hub-pos-grid  
**Estado:** done  
**Fecha:** 2026-08-27  
**Extiende:** 032, 040, 041, 042, 043, 044

---

## Problema

Hoy el baño se registra en Peluquería (cliente + paciente + precio) y el cobro vive en **Visitas / tickets**. Eso no se relaciona solo: hay que ir al menú del baño y pulsar «Agregar a visita». El ticket nuevo abre vacío y los atajos (Baño / Producto) solo rellenan texto, no el baño real ni el catálogo.

La compra de un producto igual: en inventario se puede mandar al ticket (042), pero desde el ticket no se elige el producto. Recepción ve dos “cajas” (peluquería vs punto de venta) y no un solo **día del cliente**.

El catálogo de productos sigue siendo tabla: con foto (043) es más fácil reconocer croquetas o un frasco en **cuadrícula**.

**UX (alineado a 046):** el ticket debe sentirse como **cuenta del día / POS simple** (guía de pasos, “te falta el dueño”, empty states claros, producto con picker). Venta de petshop **sin cliente** (walk-in) se documenta en **046**; esta 045 prioriza el hub con cliente + grid.

---

## Modelo mental (mezcla con sentido)

| Dónde | Para qué | Relación con el ticket |
|-------|----------|------------------------|
| Peluquería / citas / vacunas | Operación (quién, cuándo, mascota) | Servicio del día → **línea del ticket** |
| Inventario / salida | Stock real | Venta → **línea + movimiento** con `visitaId` |
| **Visitas / tickets** | **Un cobro del día** (POS): servicios + productos + saldo | Fuente de verdad de dinero |

No se elimina Peluquería. El ticket **agrupa** lo que ya ocurrió (o lo que se está cobrando ahora).

---

## User stories

### US-1 — Baño del día entra al ticket

Como **recepción**  
Quiero que al elegir cliente en el ticket vea los baños de hoy aún no cobrados  
Para no reescribir el baño a mano

**Criterios:**

- [ ] Con cliente (y fecha del ticket) se listan baños pendientes: mismo cliente, no cancelados, sin `visitaId`, sin `cajaMovimientoId`, no `pagado`
- [ ] «Incluir» agrega línea con `banioId`, descripción y monto
- [ ] Al guardar el ticket se escribe `visitaId` en el baño (si aún no está)
- [ ] Tras **crear** un baño nuevo, preguntar «¿Agregar al ticket de visita de hoy?» (mismo patrón que cita 041)

### US-2 — Vender producto desde el ticket

Como **recepción**  
Quiero elegir el producto del catálogo (picker 044) con cantidad  
Para que la compra quede en el mismo ticket del baño/consulta

**Criterios:**

- [ ] Atajo Producto abre picker + cantidad (no solo texto «Producto»)
- [ ] Línea `venta_producto` con `productoId`, monto = precio venta × cantidad
- [ ] Si hay stock, al persistir el ticket se registra salida de inventario con `visitaId` (aditivo). Si no hay stock, se avisa y no se agrega la línea
- [ ] No doble cobro: no abrir caja desde baño si ya tiene `visitaId`

### US-3 — Catálogo en cuadrícula

Como **staff de almacén**  
Quiero ver productos con foto grande, nombre, precio y stock  
Para identificar el ítem sin leer una tabla

**Criterios:**

- [ ] Toggle Lista / Cuadrícula en `/admin/inventario/productos`
- [ ] Tarjeta: foto (o placeholder), nombre, presentación, categoría, precio venta, stock
- [ ] Acciones: editar, QR, menú (igual que la fila)
- [ ] Sin foto: placeholder, no se oculta el producto
- [ ] Búsqueda aplica a ambas vistas

---

## Fuera de alcance

- POS de mostrador walk-in sin cliente → **046** (ola 2)
- Unificar `Katzen/ProductosPeluqueria` con inventario clínico
- Lector de cámara
- Auto-crear baño desde el atajo «Baño» del ticket (el atajo sigue siendo texto libre; el vínculo real es «Incluir» pendientes o el prompt post-alta)
- Rediseño completo del admin → principios en **046**

---

## Contratos de Datos y UI (Obligatorio)

- **RTDB:** sin nodos nuevos. Campos ya opcionales: `Banio.visitaId`, `VisitaLinea.banioId` / `productoId` / `movimientoInventarioId`, `Movimiento.visitaId`.
- **Aditivo en línea:** `cantidad?` en `VisitaLinea` (solo UI/cálculo; móvil ignora).
- **Pruebas:** mocks locales + util unitaria. No producción.
- **UI:** `admin-dialog-shell`, picker producto, chips de pendientes, grid de tarjetas coherente con admin.

---

## Definition of Done

- [x] `npm run test:045` + `npm run build`
- [x] QA en `tasks.md`
- [x] Preview `:4200` + hosting prod

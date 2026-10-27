# 103 — Alta rápida de producto (5 campos)

**Estado:** in_progress (2026-10-26) · **Nivel:** L1/L2 (solo UI; mismo guardado que antes) · **Pidió:** Luis («sí, haz la fase 2»)

## Cambios

- «Nuevo producto» muestra 5 campos: Nombre, Categoría, Precio de venta, **Lo que te cuesta** (nuevo aquí, opcional) y **¿Cuántos hay ahora?**. Código, unidad, mínimos, IVA, etc. se llenan solos y siguen en «Más datos».
- En «Más datos» ya no se repiten Costo y Precio de venta (sección «Margen e IVA»).
- Inicio de Inventario: botón «Producto nuevo».

## Datos

Sin cambios de modelo ni en RTDB; se usa el mismo `crearProducto`.

## Limpieza hecha con OK de Luis (2026-10-26)

- Producto de prueba «fdsfs» desactivado desde la UI (Borrar = `activo: false`, se puede recuperar).

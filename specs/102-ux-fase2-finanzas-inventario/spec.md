# 102 — Finanzas en 3 pestañas e Inventario con buscador y «Por pedir» (fase 2)

**Estado:** done (2026-10-26) · **Nivel:** L2 (solo UI/lectura; sin cambios en RTDB) · **Pidió:** Luis («haz el siguiente, continúa con lo pendiente»)

## Cambios

- **Finanzas:** de 5 pestañas a 3.
  - **Resumen:** ¿cuánto te quedó?, gráfica, lo que entró por servicio (+ nota por cobrar), ventas de hoy por veterinaria y cuentas por cobrar. Los KPIs de abajo no se repiten aquí.
  - **Cobros y gastos:** la lista con botones «Todo / Lo que entró / Gastos» (con conteo). En celular: Concepto (con fecha, categoría y método) · Monto · Acciones.
  - **Precios y costos:** sin cambios.
- **Inicio de Inventario:** buscador (lleva a Productos con `?q=`) y lista «Por pedir» (5 más urgentes, «Quedan N · mínimo M») en lugar de mensajes de alerta; botón «Ver los N por pedir» → Productos `?porPedir=1`.
- **Productos:** botones «Por pedir» y por categoría (con conteo), «N de M productos», búsqueda sin acentos y por varias palabras; la cuadrícula muestra 24 y «Ver más» (antes 529 tarjetas de golpe).

## Utils

- `inventario/inventario-catalogo-filtro.util.ts` (+ spec): `esPorPedir` (misma regla que la alerta de stock bajo), `coincideCatalogo`, `categoriasDelCatalogo`.

## Fuera de alcance

Alta rápida de producto en 5 campos (siguiente entrega).

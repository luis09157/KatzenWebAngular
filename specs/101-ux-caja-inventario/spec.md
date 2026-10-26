# 101 — Caja e Inventario más fáciles de entender (parte 1)

**Estado:** done (2026-10-26) · **Nivel:** L2 (solo UI/lógica de lectura, sin cambios en RTDB) · **Pidió:** Luis («siento que está un poco complicada o confusa»)

## Hallazgos con datos reales (solo lectura)

- Nunca se ha guardado un corte de caja; el botón estaba escondido en un banner.
- «Ingresos por servicio» sumaba un baño **programado sin pagar** ($300) como si hubiera entrado: no cuadraba con la caja.
- Finanzas: «Nuevo movimiento» abría como ingreso, aunque los cobros se hacen en Cobrar.
- Movimientos de inventario: la columna Usuario mostraba el código (uid) y Motivo mostraba `venta_directa`; 10 columnas.
- «Stock bajo» se repetía 3 veces en el inicio de Inventario; categorías en minúscula; «0 unidad».

## Cambios

- **Cobrar:** tarjeta «Corte de caja» con estado (Pendiente de hoy / Hecho a las HH:mm / Entró dinero después del corte / Sin cobros hoy).
- **Finanzas:** «Dinero de la clínica»; «Por servicio» = solo lo que entró a caja; nota aparte con lo cobrado fuera de caja y lo **por cobrar** (`serviciosSinCajaDelPeriodo`). Botón «Registrar gasto» (egreso). Pestañas y textos en lenguaje simple; periodo en palabras.
- **Inventario/Movimientos:** columnas Fecha · Producto · Qué pasó (±cantidad, había → quedan) · Motivo (+Ver ticket) · Quién (nombre del staff). Botones «Llegó mercancía», «Sacar producto», «Corregir conteo».
- **Inicio de Inventario:** sin «Muestra de stock bajo» (queda aviso + KPI), categorías con mayúscula, botón «Sacar producto», descripciones simples.
- **Productos:** plural de unidad («0 unidades», «3 cajas»).

## Utils

- `inventario/inventario-textos.util.ts` (+ spec): `motivoMovimientoTexto`, `cantidadConUnidad`, `nombreResponsable`.
- `finanzas/caja.service.ts`: `serviciosSinCajaDelPeriodo`.

## Fuera de alcance (parte 2, propuesta)

Finanzas en 3 pestañas (Hoy/Mes/Gastos); inicio de Inventario con buscador y «Por pedir»; Productos paginado; alta rápida de producto.

# 100 — Tarifas de peluquería y servicios fuera del inventario

**Estado:** in_progress (2026-10-26) · **Nivel:** L2 código + L3 datos (migración con OK de Luis) · **Pidió:** Luis

## Problema

- 74 artículos del inventario son servicios (stock 0) → ruido en alertas y catálogo.
- Las tarifas de peluquería y pensión nunca se configuraron en Finanzas: el sistema sugiere precios genéricos.
- El modelo de peluquería solo tenía un precio por tamaño; la clínica cobra por tamaño × pelo corto/largo × con corte, y gato aparte.

## Decisiones (Luis, 2026-10-26)

- Aprueba mover los servicios. «1-Baño» y «2-Baño y Corte» ($116) **no se mueven**: se revisan después con la clínica.
- Desparasitación: servicio por tamaño que incluye la pastilla (recomendación aceptada como default).
- Pendiente: precios con o sin IVA (inventario trae precios de Eleventa con IVA: pensión chica $290 = $250 + IVA; Luis confirmó pensión $250 el 2026-10-02).

## Código (esta entrega)

- `finanzas/tarifas-peluqueria.util.ts` (+ spec) y `tarifas-peluqueria.service.ts` → `Katzen/Finanzas/TarifasPeluqueria` (aditivo).
- «Nuevo baño»: chips **Tamaño** (Chico…Extragrande, Gato) y **Pelo** (corto/largo, solo «Baño»); precio sugerido desde la tarifa, editable. Sin tarifas configuradas: igual que antes.
- Finanzas → Costos de servicio: panel **Tarifas de peluquería** (5 tamaños × 3 columnas) solo admin.

## Datos (pendiente de la respuesta de IVA)

- Tarifas de peluquería con los precios del inventario (con o sin IVA según Luis).
- 33 servicios nuevos al Catálogo de servicios; «Consulta» se une a «Consulta General».
- 70 productos → `activo: false` + `movidoA` (no se borran). Rollback: `activo: true`.

## Cambio de decisión (Luis, 2026-10-26 15:56)

- Peluquería **no** usa tarifa fija: el precio lo decide la veterinaria al momento. Las tarifas quedan opcionales (vacías → los chips no salen).
- **Precio anterior:** en «Nuevo baño», si la mascota ya tiene baños con precio, se sugiere lo que se cobró la última vez (mismo servicio primero) y se dice de cuándo; se puede cambiar. `banio-precio-anterior.util.ts` (+ spec).
- Puntos 2 y 3 aprobados. Sin respuesta sobre IVA: **cada servicio conserva el precio que ya tiene en el sistema** (no cambia lo que se cobra hoy).

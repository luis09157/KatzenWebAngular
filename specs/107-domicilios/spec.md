# 107 — Domicilios: cotizador, configuración e historial con métricas

**Estado:** in_progress (2026-10-27) · **Nivel:** L3 (campos aditivos en Baño/Cita/Visita + `Katzen/Finanzas/TarifasDomicilio`) · **Pidió:** Luis · **OK de Luis: 2026-10-27 00:04 («si va»)**

## Origen (KatzenApp)

`GasHelper.calcular(km, categoria)`: gasolina = km × viajes ÷ 10 km/L × $24.50; precio = gasolina × margen.
Verificado contra 474 viajes reales en `Katzen/Gasolina` (2024–2025, solo «Semana X2» y «Semana X4»).

| App | Web (nombre claro) | Recorridos | Margen |
|---|---|---|---|
| Semana X2 | Ida y vuelta | ×2 | ×1.66 |
| Semana X4 | Llevar y traer (2 idas y vueltas) | ×4 | ×1.66 |
| Campaña | Campaña | ×4 | ×1.32 |
| Ruta | Ruta | ×2 | ×1.32 |
| Moto | Moto | ×2 | ×1.66 |

## Decisiones de Luis (2026-10-26/27)

- La fórmula **sugiere**; la veterinaria puede cambiar el precio.
- Panel de configuración (gasolina, km/L, % de ganancia por tipo).
- Domicilio desde **Nuevo baño**, **Citas** y **Cobrar** (cotizar o agregar suelto).
- Guardar **historial de domicilios** para métricas: cuántos por mes, a dónde, con quién, para qué, km, costo, ganancia.
- Redondeo y renglón en Finanzas: sin preferencia → configurable (default: al peso); renglón propio «Domicilio».

## Contratos de datos (todo aditivo) — versión implementada

- `Katzen/Finanzas/TarifasDomicilio` — `{ precioLitro, kmPorLitro, redondeo: 'centavos'|'peso'|'cinco', tipos: { [id]: { nombre, recorridos, margenPct, activo, orden, nombreApp? } }, updated_at, updated_by }`. Reglas existentes de `Katzen/Finanzas` (staff) la cubren.
- `DomicilioDatos` (km, tipo, recorridos, precioLitro, kmPorLitro, margenPct, costoGasolina, precioSugerido, precio, ganancia, dirección/colonia/municipio/linkMaps, cotizadoEn/Por) guardado en:
  - `Katzen/Banios/{id}/domicilio` (al editar sin domicilio → `null`).
  - `Katzen/Citas/{id}/domicilio`.
  - Línea del ticket `categoria: 'domicilio'` + `domicilio` + `domicilioDe: { tipo: 'banio'|'cita', id }` (no usa `banioId`, para no tocar el cobro del baño).
- `CajaCategoria` y `VisitaLineaCategoria` admiten `'domicilio'` (la app no lee Visitas).
- `Katzen/Cliente/{id}/kilometrosCasa` — solo si la veterinaria toca «Guardar N km en su ficha» (número, como la app).
- **Sin nodo `Katzen/Domicilios` ni reglas nuevas:** el historial vive en cada baño, cita y ticket; las métricas lo juntan en solo lectura junto con `Katzen/Gasolina` (474 viajes de la app). Así no hay dos lugares que se desincronicen y no hay que publicar reglas.

## Fases

1. Util `domicilio-cotizacion.util.ts` (+ spec con casos reales de la app).
2. Configuración en Finanzas → Precios y costos.
3. Componente `app-domicilio-cotizador` (km del cliente, tipo, sugerido, precio editable, guardar km en ficha).
4. Nuevo baño · 5. Citas · 6. Cobrar (línea al pasar baño/cita + botón «Domicilio»).
7. Historial y métricas (Finanzas → Domicilios): por mes, zonas/colonias, clientes, para qué, km, costo, ganancia; exportar CSV.

## Rollback

Quitar UI; los campos/nodos son aditivos (no rompen app ni datos). Borrar `Katzen/Domicilios` y `TarifasDomicilio` solo con OK de Luis.

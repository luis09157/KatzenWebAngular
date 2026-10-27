# 107 — Domicilios: cotizador, configuración e historial con métricas

**Estado:** draft (2026-10-27) · **Nivel:** L3 (nodo RTDB nuevo + campos aditivos en Baño/Cita) · **Pidió:** Luis · **Esperando OK de Luis para codear**

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

## Contratos de datos (todo aditivo)

- `Katzen/Finanzas/TarifasDomicilio` — `{ precioLitro, kmPorLitro, redondeo: 'centavos'|'peso'|'cinco', tipos: { [id]: { nombre, recorridos, margenPct, activo } }, updated_at, updated_by }`.
- `Katzen/Domicilios/{id}` — historial: `{ fecha (ISO), cliente_id, cliente, paciente_id?, paciente?, direccion, linkMaps?, km, tipo, tipoNombre, recorridos, precioLitro, kmPorLitro, costoGasolina, precioSugerido, precio, ganancia, origen: 'banio'|'cita'|'caja', origenId?, visitaId?, staff_uid, staff_nombre, estado: 'cotizado'|'cobrado'|'cancelado', created_at }`.
- `Banio.domicilio?` y `Cita.domicilio?` — `{ domicilioId, km, tipo, precioSugerido, precio }` (opcional; la app ignora el campo).
- `VisitaLinea.categoria` admite `'domicilio'` + `domicilioId?` (la app no lee Visitas).
- Reglas: `Katzen/Finanzas` y `Katzen/*` staff ya cubren; `Katzen/Domicilios` necesita entrada explícita (staff lee/escribe, cliente no).
- **No se escribe** en `Katzen/Gasolina` (estructura de la app con totales por mes que recalcula la app). Las métricas **leen** ese historial (474 viajes) en solo lectura y lo suman al nuevo.

## Fases

1. Util `domicilio-cotizacion.util.ts` (+ spec con casos reales de la app).
2. Configuración en Finanzas → Precios y costos.
3. Componente `app-domicilio-cotizador` (km del cliente, tipo, sugerido, precio editable, guardar km en ficha).
4. Nuevo baño · 5. Citas · 6. Cobrar (línea al pasar baño/cita + botón «Domicilio»).
7. Historial y métricas (Finanzas → Domicilios): por mes, zonas/colonias, clientes, para qué, km, costo, ganancia; exportar CSV.

## Rollback

Quitar UI; los campos/nodos son aditivos (no rompen app ni datos). Borrar `Katzen/Domicilios` y `TarifasDomicilio` solo con OK de Luis.

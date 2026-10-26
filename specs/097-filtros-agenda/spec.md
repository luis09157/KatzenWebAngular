# 097 — Filtros de agenda en Citas, Peluquería y Pensión

**Estado:** done (2026-10-26) · **Nivel:** L2 (UI + util, solo lectura) · **Pidió:** Luis

## Problema

Las listas solo mostraban Hoy y Mañana. Lo de pasado mañana en adelante y lo atrasado sin cerrar solo se veía buscando. Las tarjetas de números contaban registros que la tabla no mostraba (Peluquería: «Programados 7» con 3 visibles; Citas: «Pendientes 3 / Confirmadas 2» con la tabla vacía).

## Solución

- Fila de botones arriba de la lista, cada uno con su número: **Pendientes** (por defecto) · **Hechos** · **Por cobrar** · **Pagados** · **Todos**. En celular se desliza de lado (botones de 44px).
- **Pendientes** en secciones: **Atrasados** (naranja) → **Hoy** → **Mañana** → un bloque por cada día siguiente («Miércoles 28/10») → Sin fecha.
- «Hecho» y «pagado» son independientes (un baño puede estar pagado por adelantado y no hecho). Por cobrar = hecho y sin pagar.
- El buscador: en Pendientes busca en todo el historial (como antes); en otro botón busca dentro de ese filtro.
- Tarjetas de números clicables: filtran la lista y suben a ella.

| Módulo | Pendiente | Hecho | Pagado | Fecha de agenda |
|---|---|---|---|---|
| Citas | no completada ni cancelada | completada | `cobrada` o `cajaMovimientoId` | `fecha` |
| Peluquería | programado / en proceso | completado | `pagado` o `cajaMovimientoId` | `fecha_banio` |
| Pensión | reservada / activa | finalizada | `cajaMovimientoId` o `cobradaEnVisitaId` | reservada → ingreso; activa → salida prevista (vencida = atrasada; si no, Hoy) |

## Código

- `core/utils/agenda-filtros.util.ts` (+ spec): clasificación, conteos, secciones.
- `shared/admin/agenda-listado.state.ts`: estado del listado compartido por los 3 módulos.
- `shared/admin/agenda-filtros.component.*`: fila de botones.
- `admin-stat-card`: inputs `clickable`, `activo`, output `seleccionar`.

## Impacto en Firebase RTDB

Ninguno (solo lectura).

## QA (2026-10-26, vista previa QA con datos reales)

- Peluquería: Pendientes 8 (4 atrasados, Hoy 1, Mañana 2, Miércoles 28/10 1). Por cobrar 4 (baños completados de 2024 sin pagar). Buscar dentro de Por cobrar; tarjeta Pendientes sube a la lista.
- Citas: Pendientes 5, las 5 atrasadas (antes invisibles).
- Pensión: 1 activa con salida prevista vencida → Atrasadas.
- Celular 412px: botones se deslizan; página sin scroll horizontal; tarjetas por sección.
- CI: lint, unit tests y build OK. `check:mobile`: 0 errores nuevos.
- No se agregaron, editaron ni borraron registros (cambio solo de lectura).

## Anexo — Motivos de cita (2026-10-26)

Lista agrupada en `citas/cita-motivos.util.ts`: Consulta · Prevención · Cirugía (esterilización/castración, enucleación, otohematoma, retiro de tumores, tejido blando) · Estudios (análisis de sangre, radiografía, ecografía) · Otro. Se quitaron «Grooming (Peluquería)» (tiene su menú), «Emergencia» (no se agenda) y especialidades que la clínica no hace. Citas viejas conservan su motivo (grupo «Motivo anterior»). Sin migración: `motivo` sigue siendo texto.

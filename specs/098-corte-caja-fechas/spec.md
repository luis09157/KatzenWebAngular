# 098 — Corte de caja y fechas tecleadas

**Estado:** done (2026-10-26) · **Nivel:** L2/L3 (escrituras de caja aditivas) · **Pidió/autorizó:** Luis

## Errores encontrados

1. **«Guardar corte» fallaba con Notas vacías** (lo vio Luis en un día sin ventas): se mandaba `notas: undefined` y Firebase rechaza el objeto («value argument contains undefined in property 'notas'»). Reproducido contra una base local de prueba.
2. **Fechas tecleadas al revés:** el adaptador nativo usaba `Date.parse`; «02/10/2026» se leía como 10 de febrero (día ≤ 12). Nota (099): los campos son de solo calendario, así que en la práctica nadie podía teclear; queda como protección.
3. **Cobros con la fecha del ticket/servicio**, no la del pago: cobrar hoy un ticket de ayer metía el dinero en ayer (fuera del corte de hoy).
4. **«Marcar pagado» en Peluquería** no registraba el dinero en caja.
5. **Un solo corte por día**: lo cobrado después del corte no entraba en ningún corte.
6. **Fondo inicial** = todo lo contado el día anterior (sin retiro); día sin cobros → fondo $0.
7. **Borrar ticket pagado** dejaba el ingreso en caja.
8. Finanzas: paginación «0 of 0».

## Cambios

- `core/utils/rtdb-row.util.ts` → `sinUndefined()`; usado en `guardarCorte` y `crearMovimiento`.
- `shared/datepicker/katzen-date-adapter.ts` (`KatzenDateAdapter` + `KatzenDateModule`, reemplaza `MatNativeDateModule` en 17 módulos) y `parseFechaTecleada()` (+ spec).
- `ejecutarFlujoCobro` acepta `fechaPago` (POS manda hoy); `registrarPago`/`devolverLineas` usan hoy; cobro en caja desde Peluquería, Pensión y Citas sin `fechaDefault` (hoy). El concepto conserva la fecha del ticket.
- Corte: corte **complementario** (movimientos con `createdAt` posterior al último corte del día), **retiro de efectivo** → `fondoSiguiente`, fondo desde el último corte aunque no haya turno, diferencia solo al escribir lo contado, fecha nunca bloqueada, banner vuelve a salir si entra dinero después del corte.
- Peluquería: el menú «Marcar pagado» → «Cobrar (queda en caja)» (`registrarEnCaja`).
- Ticket con cobros: no se borra; pide usar **Devolver** primero.

## Impacto en Firebase RTDB (aditivo)

`Katzen/Caja/Cortes/{id}`: campos opcionales nuevos `retiroEfectivo`, `fondoSiguiente`, `complementario`, `desdeCreatedAt`. Sin migración ni borrado. La app móvil los ignora.

## Rollback

Revertir el PR y desplegar hosting. Los cortes guardados con campos nuevos siguen siendo válidos para el código anterior (solo ignora los campos).

## QA

Ver `tasks.md`.

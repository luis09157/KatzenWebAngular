# 098 — Tareas y QA

- [x] `sinUndefined` en cortes y movimientos (+ spec). Error reproducido antes con Firebase SDK contra base local de prueba: «push failed: value argument contains undefined in property 'notas'»; con notas → OK.
- [x] `KatzenDateAdapter` / `KatzenDateModule` (+ spec `parseFechaTecleada`).
- [x] Cobro en el día del pago (POS `fechaPago`, abonos, devoluciones, cobro en caja de baño/pensión/cita) (+ spec pos-orquestación).
- [x] Corte complementario, retiro, fondo, diferencia, fecha visible y editable (+ specs caja-corte).
- [x] Peluquería «Cobrar (queda en caja)»; ticket con cobros pide Devolver.
- [x] Finanzas: paginación; Fecha visible en Corte y Registrar cobro (`CajaDialogModule` + `SharedModule`).

## QA 2026-10-26 (vista previa QA, sin guardar en producción)

- Finanzas: teclear «02/10/2026» → «Día 2026-10-02»; «1/10/26» → «Día 2026-10-01» (antes 10 de febrero).
- Corte 01/10: esperado $2,789.80; antes de escribir: «Escribe el efectivo contado»; contado 2789.80 → «$0.00 · cuadrada»; retiro 2289.80 → «Quedan $500.00 para el siguiente turno». Fecha visible y editable dentro del corte. No se guardó.
- Registrar cobro: la Fecha se ve (26/10/2026). No se guardó.
- CI: lint, unit tests y build OK. `check:mobile`: 0 errores nuevos.
- Pendiente con datos reales (lo hace Luis al cerrar hoy): guardar un corte con Notas vacías.

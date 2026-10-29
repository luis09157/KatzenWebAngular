# Spec 115 — Bugs graves de la revisión del 29 oct 2026

**Pidió:** Luis («corrige los puntos 1, 2 y 3»; «las citas no deben tener límite hasta las 6 pm»). Documento: «KatzenVet — Revisión de bugs y mejoras».

## 1. Editar una cita la movía de día (L2)
Causa: al abrir se tomaba el día del texto UTC de `fecha`; al guardar `new Date('YYYY-MM-DD')` se lee en UTC (día anterior en MTY). No hay ni había límite de horario: el error dependía de la hora por el desfase UTC−6.
Arreglo: `cita-fecha.util.ts` (`fechaHoraLocalDeCita`, `diaLocalDeControl`, `instanteLocalCita`, `fechaHoraTextoLocal`) + tests a 0, 6, 11, 17, 18, 20 y 23 h (abrir y guardar sin cambios = mismo instante). El control de fecha recibe un `Date` local (el calendario ya no muestra un día antes). `validarFecha` y el detalle usan el día local.
QA preview (29 oct, sin guardar): Editar Kira → 28/10/2026 · 11:00 a.m.; Editar Pily → 28/10/2026 · 06:00 p.m. (antes 29/10). Sin errores de «fecha pasada». CI verde.

## 2. «Ya lo pagaron» no registraba el dinero (L2)
Causa: la casilla del diálogo de baño solo guardaba `pagado: true` (sin caja ni ticket). Evidencia: Oreon $100 y Billy $50 (27 oct) fuera de Finanzas/corte.
Arreglo: con la casilla marcada, cada mascota debe tener precio (si falta, aviso y no guarda). Se guardan con `pagado:false`, cada baño entra al ticket del día del cliente (`agregarServicioAVisita`, que también agrega el domicilio) y se abre Cobrar. Al cerrar el ticket se crea el cobro en caja y el baño queda pagado (spec 039). Un baño que ya estaba pagado / en ticket / con caja no se vuelve a cobrar al editarlo. Los $150 del 27 oct no se tocaron (decisión de Luis).

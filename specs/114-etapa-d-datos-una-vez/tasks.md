# Tasks — spec 114
- [x] A6 tamaño una vez
- [x] A7 aviso teléfono repetido
- [x] QA preview (2026-10-27 noche, sin guardar)

## Registro QA
- Nuevo cliente con teléfono 3469176533 → «Ya hay un cliente con este teléfono: Karla Rojas…». Cancelado.
- Nuevo baño con Maruca (Alejandra) → sección «Tamaño» con «Su ficha no tiene tamaño…» y Chico / Mediano / Grande / Extragrande (sin Gato, sin pelo: no hay tarifas). Cancelado.
- CI verde.

## Limpieza de registros de prueba (2026-10-27 21:50, OK de Luis «Dalos de baja»)
Baja lógica desde la UI de producción (Borrar = `activo:false` + fecha de baja; nada se borró):
- Vacuna «Triple Felina (prueba)» de Oreon (Luis), 05/06/2026 (`-OuOHd1ZXK1AwO1JXIlV`).
- 4 citas canceladas de Oreon (Luis): 12/06 «Consulta de seguimiento (PRUEBA)», 26/08 ×2, 04/09.
- 2 baños cancelados de Oreon (Luis) del 01/10 («Tratamiento especial»).
No se tocó (no es claramente prueba / afecta dinero):
- Baños de hoy de Oreon y Billy (mascotas de Nancy): completados, Oreon **pagado $100**.
- Tickets de Oreon (Luis): cerrados 02/10, 03/10 ×2, 25/10 y uno abierto con fecha 28/10; consentimiento vigente 04/10; estancia de pensión desde 02/10. Pendiente de Luis.
- Clientes E2E/TEST ya estaban dados de baja (≈45).
- Vacunas 2024 sin refuerzo: quedan como historial, no generan avisos (Luis).

# Spec: Menos botones, una acción principal por pantalla

**ID:** 096-simplificar-acciones
**Estado:** in_progress
**Fecha:** 2026-10-25
**Autor:** Claude — pedido de Luis («hay ventanas con muchísimos botones que no sabemos para qué son y muchos se repiten»)

---

## Problema

Análisis estático de `src/app/**/*.html` (botones agrupados por la acción que ejecutan) + revisión en la preview:

| Pantalla | Repetido |
|----------|----------|
| Expediente (`/admin/paciente`) | Historial, Vacuna y Consentimiento ×3 cada uno (banner + pestaña + estado vacío); 9 botones en el banner. «Baño» del banner no funcionaba si la pestaña Baños no estaba abierta (salía un aviso). |
| Citas, Peluquería, Pensión, Productos | «Nuevo …» arriba y otra vez en cada sección vacía (hasta 5 «Nuevo baño») |
| Cobrar | «Nueva venta» ×3, «Pagar ya» ×2, PDF / Imprimir / WhatsApp ×2 |
| Hoy | «Citas hoy» y «Abrir citas» → misma ruta |
| Inventario | «Ver productos» ×2; «Ver alertas» / «Ir a alertas» |
| Listados | 5–6 íconos sin texto por fila (Clientes: ojo, banco, recibo, huella, lápiz, bote) |
| Menú lateral | ~20 entradas; «Pacientes» y «Buscar paciente» separados; Inventario con 6 entradas |

## Regla (aplica a todo módulo nuevo o tocado)

1. **Una sola acción principal por pantalla**, con texto, siempre visible.
2. Lo secundario va en ⋮ **con nombre escrito**. Íconos sueltos solo para acciones universales (cerrar, buscar).
3. Los estados vacíos **explican**; no repiten el botón principal.
4. Tocar un registro abre su detalle (celular y escritorio).

---

## Fases

### F1 — Expediente (HECHO, 2026-10-25)

- [x] Banner: solo «Volver a buscar».
- [x] Botón flotante **«+ Agregar»** (sticky abajo a la derecha; ancho completo en celular) con menú rotulado: Clínico (Historial clínico, Vacuna, Desparasitación, Recordatorio, Consentimiento) · Agenda y servicios (Cita, Baño / peluquería, Pensión) · Cuenta del día (cobrar).
- [x] Cada opción abre su pestaña (si tiene) y el mismo formulario de antes.
- [x] Pestañas y estados vacíos sin botones repetidos; texto «Usa «+ Agregar»…».
- [x] Baño: si la pestaña no está cargada, se abre y luego el formulario (antes: aviso «Abre la pestaña Baños»).
- [x] Pruebas: `pacientes-agregar-menu.spec.ts`; Cypress actualizado (`cy.agregarEnExpediente`).
- Desparasitación quedó dentro de «+ Agregar» (Luis no indicó que fuera aparte).

### F2 — Listados

- [x] Un «Nuevo …» arriba; estados vacíos sin el botón repetido (2026-10-25): 28 botones en 19 pantallas. Script: se quitó solo donde la misma acción tiene botón visible en la pantalla.
- [x] Peluquería (celular): tarjetas con hora, estado, paciente, servicio, dueño, peluquero, precio; **una** acción visible según el momento (Poner precio → Iniciar baño → Listo para cobrar → Ver detalle) + ⋮.
- [x] Citas (celular): tarjetas; acción visible «Atender» (si tiene paciente y no está completada/cancelada) o «Ver detalle» + ⋮.
- [ ] Pensión, Historiales, Vacunas, Recordatorios, Productos: tarjetas en celular.
- [ ] Escritorio: fila con máximo 1 ícono + ⋮ (hoy 4–6 íconos).

### F3 — Cobrar

- [ ] Quitar duplicados («Pagar ya», PDF / Imprimir / WhatsApp) y dejar un solo paso claro para pagar.

### F4 — Navegación

- [ ] Unir Pacientes + Buscar paciente; Inventario una entrada con pestañas; Hoy e Inventario sin enlaces duplicados.

---

## Fuera de alcance

Datos RTDB, flujos de negocio, app móvil. Solo presentación.

## Validación

CI del PR (lint + unit + build) · preview Firebase revisada a 412 px y 1366 px · `check:mobile` 0 nuevos.

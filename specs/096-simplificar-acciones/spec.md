# Spec: Menos botones, una acción principal por pantalla

**ID:** 096-simplificar-acciones
**Estado:** in_progress (F1–F4 hechas salvo lo marcado)
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
- [x] Pensión (Registrar ingreso / salida / Agregar al ticket / Editar), Historiales y Vacunas (Ver detalle), Recordatorios (WhatsApp si está pendiente, si no Ver detalle): tarjetas en celular. Productos ya tenía cuadrícula.
- [x] Celular: encabezado corto en todos los listados (sin descripciones largas) — `admin-page-layout.scss`.
- [x] Peluquería ⋮: «Listo para cobrar (lo cobra mostrador)» y «Agregar al ticket del cliente ahora» (antes «… (mostrador)» y «Enviar a mostrador (Cobrar)», que se confundían).
- [x] Previews de PR en una sola dirección fija (`channelId: qa`).
- [x] Escritorio: fila con 1 ícono principal + ⋮ en Peluquería, Pensión, Citas, Clientes, Historiales, Vacunas, Recordatorios, Pacientes, Productos y Proveedores (antes 3–6 íconos). Pendiente (sin ⋮ todavía): Personal, Consentimientos, Alertas y listas del expediente.

### F3 — Cobrar

- [x] Paso Cobrar: Imprimir / PDF / WhatsApp no se repiten en el pie cuando está «Ticket digital». Inicio: sin «Nueva venta» ni «Abrir catálogo» repetidos. «Pagar ya» computadora/celular son uno por pantalla (se quedan). La barra inferior del celular (Caja / Tickets / Productos) se queda (055).

### F4 — Navegación

- [x] Inventario: una sola entrada en el menú (con contador de alertas); secciones en tarjetas de su pantalla. Hoy sin «Abrir citas»; Inventario sin «Ver productos / Ir a alertas» repetidos.
- [x] Pacientes + Buscar paciente: **una sola entrada «Pacientes»** (Luis, 2026-10-26). Abre el directorio (admin, veterinario y recepción); peluquero, que no tiene directorio, abre la búsqueda de expediente con el mismo nombre. Queda marcada dentro del expediente; el botón del expediente dice «Volver a Pacientes» y regresa al directorio. Los atajos directos al expediente (`/admin/paciente?id=…`) siguen igual. Cypress: `admin-pacientes-sidenav.cy.ts`.

---

## Fuera de alcance

Datos RTDB, flujos de negocio, app móvil. Solo presentación.

## Validación

CI del PR (lint + unit + build) · preview Firebase revisada a 412 px y 1366 px · `check:mobile` 0 nuevos.

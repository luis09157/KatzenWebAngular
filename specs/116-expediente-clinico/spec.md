# Spec 116 — Expediente clínico: fotos, receta y cobro al terminar

**Pidió:** Luis (29 oct 2026): «los expedientes tengan posibilidad de agregar imágenes, fácil, que no sea complicado subir fotos». WhatsApp: nada automático, solo un botón para la veterinaria.

Tres entregas separadas (una versión estable por entrega):

1. **116.1 Fotos en la consulta** (esta) — L2.
2. **116.2 Receta para el dueño** (imprimir / PDF / WhatsApp con botón) — L2.
3. **116.3 «¿Cobrar ahora?»** al guardar consulta o vacuna — L2.

## 116.1 Fotos y estudios en la consulta

**Antes:** el adjunto estaba escondido en «Más datos (opcional)», máx. 5, no abría la cámara, y **al editar una consulta se borraban los archivos** (`archivos = []` si no se elegían nuevos). La ruta usaba `data.paciente_id` (vacío al editar o al elegir mascota en el diálogo) y si una foto fallaba la consulta se guardaba sin avisar.

**Ahora:**
- Bloque visible «Fotos y estudios» debajo de la nota: **Tomar foto** (cámara trasera en celular) y **Elegir foto o archivo** (galería, varias a la vez, o PDF).
- Miniaturas al instante, ✕ para quitar; las nuevas se marcan «Nueva» y se suben al tocar Guardar.
- La foto se achica en el navegador (lado mayor 1600 px, JPEG) → sube rápido con poca señal. Si el navegador no puede leerla (HEIC en Chrome de escritorio) se sube tal cual (≤10 MB).
- Hasta **10** por consulta. PDF ≤10 MB.
- Al editar se **conservan** las que ya tenía. Quitar una solo la saca de la consulta (el archivo no se borra de Storage).
- Si una foto no sube, la consulta **no se guarda** y queda abierta para reintentar.
- Detalle de la consulta y ficha de la mascota (Pacientes y ficha rápida): galería de miniaturas; al tocar se abre en grande (pantalla completa en celular, flechas entre fotos). PDF como renglón «Ver».

**Datos (aditivo, sin cambios de contrato):** mismo campo `Katzen/Historiales_Clinicos/{id}/archivos: string[]` (URLs de descarga), misma carpeta `historiales_clinicos/{pacienteId}/{archivo}` y mismas `storage.rules` (imagen o PDF, <10 MB, sesión iniciada). No requiere deploy de reglas. Lectura tolerante a legacy (array, objeto o texto).

**Archivos:** `historial-archivos.util.ts` (+spec), `historial-foto-reducir.ts`, `fotos-expediente.component.ts` (galería + visor, standalone), `historial-dialog.*`, `historial-detalle.*`, fichas en `pacientes/` y `pacientes-admin/`.
**Intacto:** guardado de la consulta (servicio), notas internas, log de actividad, portal, cobro.

## 116.2 Receta para el dueño

**Antes:** la receta solo era un campo de texto dentro de «Más datos»; no se podía imprimir ni mandar.

**Ahora:** botón **Receta** en el detalle de la consulta, en el menú ⋮ de Historiales («Receta para el dueño») y en el expediente de la mascota (ícono 💊 en cada consulta). Abre una vista previa con clínica, fecha de la consulta, mascota (especie · raza · sexo · peso), dueño, **Receta**, **Indicaciones** (manejo terapéutico) y quién atendió.
- **Enviar por WhatsApp:** abre el chat del dueño con la receta escrita en el mensaje. La veterinaria revisa y aprieta enviar. Sin teléfono de 10 dígitos el botón se apaga y se avisa.
- **Imprimir / PDF:** PDF A4 (sigue en otra hoja si es largo) con espacio de firma. En computadora se abre en otra pestaña para imprimir; en celular abre el menú de compartir (WhatsApp, imprimir, guardar).
- No sale el diagnóstico presuntivo ni las notas internas.
- Si la consulta no tiene receta ni indicaciones, lo dice y explica dónde escribirlas.
- Expediente en celular/tablet (≤900 px): un toque en la consulta abre el detalle (antes solo doble clic y los botones están ocultos en pantallas chicas). En computadora igual que antes.

**Datos:** solo lectura (consulta, mascota, dueño, `Katzen/Config/clinica/nombre`). No se guarda nada ni se manda nada solo.
**Archivos:** `receta-documento.util.ts` (+spec), `receta-pdf.util.ts`, `receta-dialog.component.*` (standalone), accesos en `historial-detalle`, `historiales.component`, `pacientes.component`.

## 116.3 «¿Cobrar ahora?» al terminar

**Antes:** «Enviar a cobrar» existía en consultas y vacunas, pero escondido en el menú ⋮; nadie lo ofrecía al terminar.

**Ahora:** al guardar una **consulta nueva** o una **vacuna nueva aplicada** sale un aviso «Consulta guardada / Vacuna guardada — ¿Cobras ahora a {mascota}?» con **Cobrar ahora** / **Después**.
- **Cobrar ahora:** pide el monto (vacuna: sugiere su precio si lo tiene), agrega la línea al ticket del día del dueño y abre **Cobrar**. Es el mismo camino que «Enviar a cobrar» (`VisitasService.agregarServicioAVisita`, misma descripción y vínculo `historialId`/`vacunaId`).
- **Después:** todo igual que antes (se cobra desde Cobrar o «Enviar a cobrar»).
- El formulario se cierra cuando se cierra Cobrar, así funciona igual desde cualquier pantalla (Historiales, expediente, Vacunas, «Llegó un paciente», que navega al expediente al cerrar).
- No pregunta: al **editar**, en vacunas **pendientes**, si ya está en un ticket, ni cuando la consulta viene de una **cita** (Citas ya pregunta el cobro).
- Vacuna aplicada: un solo aviso (el «¡Éxito!» y el texto del refuerzo van dentro del mismo aviso) → un clic menos.
- Si algo falla en el cobro, la consulta/vacuna ya quedó guardada y el formulario se cierra.
- Fecha del ticket: día local de la consulta/vacuna (la vacuna se guarda en UTC: una de las 8 pm no cae al día siguiente).

**Datos:** sin campos nuevos. **Archivos:** `visitas/cobrar-al-terminar.util.ts` (+spec), `visitas/cobrar-al-terminar.service.ts` (+spec), `historial-dialog.component.ts` (+4 tests), `vacuna-dialog.component.ts`.
**Intacto:** «Enviar a cobrar», flujo de Citas, Cobrar/ticket/caja, pensión.

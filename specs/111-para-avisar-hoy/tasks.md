# Tasks — spec 111

- [x] Util puro + unit tests (agrupar, 4 semanas, 7 días vacuna, citas día local, fallecidos, sin teléfono)
- [x] Loader lazy + diálogo standalone (Enviar / Llamar / Copiar / No avisar / Deshacer)
- [x] Número en menú, franja en Hoy, botón en Recordatorios
- [x] QA preview 1280 / 412 sin enviar ni guardar
- [x] Publicar (Luis aprobó el plan 2026-10-27)

## Registro QA
2026-10-27 · preview, datos reales, sin enviar ni guardar:
- Menú: número 4 junto a Recordatorios. Hoy: franja «Tienes 4 clientes para avisar». Recordatorios: «Para avisar hoy (4)».
- Lista: Cita mañana Kira 11:00 a.m. (Esterilización) y Pily 6:00 p.m. (Vacunación) — Pily confirma el arreglo de fecha local; Baño mañana «Coco, Nacho, Tina y Maruca» (Alejandra, 1 solo mensaje, 12:30 p.m. = dato real editado 18:36); Baño mañana Niky 5:45 p.m.
- Billy (baño de mañana borrado, `activo:false`) no sale: correcto.
- «Ver mensaje» muestra el texto completo. No se tocó Enviar / No avisar (escriben en registros reales); cubierto por unit tests.
- 412: botones a 44 px, «Enviar al cliente» a todo el ancho, sin scroll lateral.
- CI verde a la primera.

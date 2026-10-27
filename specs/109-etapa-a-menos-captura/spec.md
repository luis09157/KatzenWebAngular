# 109 — Etapa A: menos captura doble

**Estado:** done (2026-10-27) · **Nivel:** L2 (UI; usa los mismos guardados de siempre) · **Pidió:** Luis (análisis UX → «empiezas con la Etapa A»)

Origen: documento «KatzenVet — Análisis de experiencia y automatización» (2026-10-27).

## Cambios

- **Terminar y cobrar (Peluquería):** el botón principal de un baño en proceso (o terminado sin cobrar) ahora es «Terminar y cobrar»: lo marca completado, lo pasa al ticket del día (con su línea de domicilio si tiene) y abre Cobrar. En el menú queda «Terminar (lo cobra mostrador después)».
- **Cierre del día:** aviso en Hoy cuando hay baños/citas pendientes o tickets abiertos de días anteriores; la ventana permite «Hecho» / «No vino» por renglón o todos de un jalón (los tickets solo se abren en Cobrar, no se tocan). Cita «No vino» = cancelada con motivo «No vino (cierre del día)». Carga diferida.
- **Expediente:** botones a la vista: Consulta, Vacuna, Baño, Agendar cita, Cobrar (los mismos del menú «Agregar»).
- **Paginador en español** en todas las tablas («1 – 20 de 273»).

## Decisiones de Luis para la Etapa B (anotadas)

- Recordatorios: el sistema avisa a la clínica y la veterinaria toca «Enviar» (por ahora no se manda solo al cliente).
- Baño recomendado cada 4 semanas.

## Utils

- `cierre-dia/cierre-dia.util.ts` (+ spec) · `core/paginator-es.ts` (+ spec).

## Carga inicial más ligera

- `AppModule` importaba `DashboardModule` de forma directa además de cargarlo por ruta (`/admin/inicio`). Eso metía Hoy completo (Cobrar, diálogos de cita, caja, alta rápida…) en la carga inicial, también para la landing y el portal. Se quita la importación directa: Hoy sigue cargando por su ruta. Sus rutas sueltas (`/inicio`, `/expediente` en la raíz) nunca se alcanzaban porque el comodín `**` va antes. Los servicios que proveía ya son `providedIn: 'root'`.

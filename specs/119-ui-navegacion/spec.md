# Spec 119 — UI: barra inferior, nombres unificados y resúmenes en cero

**Pidió:** Luis (30 oct 2026), recomendaciones UX/UI: «empieza». L2 (solo UI).

1. **Barra inferior en celular (<900 px):** Hoy · Pacientes · Peluquería · Cobrar · Más (abre el menú). Respeta permisos por rol (`canShow`); marca la pantalla actual. El contenido deja espacio abajo. La barra de Cobrar (Caja…) y el «+ Agregar» del expediente suben para no quedar tapados (`--admin-bottom-nav-h`).
2. **Nombres unificados:** barra superior «Inicio» → **Hoy** (como el menú); «Historiales» → **Consultas** (título, botón «Nueva consulta», diálogo «Nueva/Editar consulta», «Detalle de la consulta»); «Administración de X» → **X** (Clientes, Citas, Vacunas, Peluquería, Recordatorios, Personal y portal, Contactos web, Pacientes); «Punto de venta» → **Cobrar**. Cypress actualizado.
3. **Resúmenes en cero ocultos:** si todas las tarjetas del «Resumen del módulo» valen 0, no se muestra (ni su título). No aplica si alguna tarjeta es filtro (Pensión).
4. Arreglo: el ajuste de botones del detalle de consulta en celular (116.2) nunca aplicaba por especificidad (`check:mobile`).

**Archivos:** `layouts/admin-main-layout.*`, `shared/admin/admin-kpi-grid.component.ts`, `admin-kpi-vacio.util.ts` (+spec), `styles/admin-page-layout.scss`, `visitas.component.scss`, `pacientes.component.scss`, títulos (config + html), `historial-detalle.component.scss`, cypress.
**Pendiente (aviso de check:mobile, ya conocido):** 18 tablas abren el detalle solo con doble clic (no con toque) — siguiente paso.

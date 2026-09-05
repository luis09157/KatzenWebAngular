# Índice de specs — KatzenVet

> **Autogenerado** por `node scripts/specs-index.mjs` a partir de `specs/NNN-*/spec.md`. **No editar a mano**: cambia el `Estado:` en la spec y regenera.

Total: **67** specs · `done`: 56 · `in_progress`: 8 · `superseded`: 3

| # | Carpeta | Título | Estado |
|---|---------|--------|--------|
| 001 | [baseline](001-baseline/spec.md) | Baseline — KatzenVet Web | done |
| 002 | [portal-clientes-usuarios](002-portal-clientes-usuarios/spec.md) | Portal clientes en módulo Usuarios | done |
| 003 | [validacion-agenda-citas](003-validacion-agenda-citas/spec.md) | Validación de agenda de citas | done |
| 004 | [timepicker-dialog](004-timepicker-dialog/spec.md) | Timepicker dialog (selección de hora) | done |
| 005 | [loading-feedback-ux](005-loading-feedback-ux/spec.md) | Loading contextual y overlay no trabado | done |
| 006 | [revocacion-sesiones-portal](006-revocacion-sesiones-portal/spec.md) | Revocación inmediata de sesiones al desactivar portal | done |
| 007 | [politica-mermas-inventario](007-politica-mermas-inventario/spec.md) | Política de mermas / stock negativo (inventario) | done |
| 008 | [rtdb-permisos-granulares](008-rtdb-permisos-granulares/spec.md) | Permisos RTDB granulares por rol | done (histórico; **supersedida** en granularidad por `011-staff-acceso-admin-unificado`) |
| 009 | [cascada-baja-cliente](009-cascada-baja-cliente/spec.md) | Cascada baja lógica de cliente | done |
| 010 | [notas-internas-historial](010-notas-internas-historial/spec.md) | Notas internas en historial clínico | done |
| 011 | [staff-acceso-admin-unificado](011-staff-acceso-admin-unificado/spec.md) | Acceso admin unificado para todo staff | done |
| 012 | [perfiles-dual-y-duenas](012-perfiles-dual-y-duenas/spec.md) | Perfiles duales y dueñas operativas | done |
| 013 | [registro-portal-cliente-landing](013-registro-portal-cliente-landing/spec.md) | Registro portal cliente (admin + landing) | done |
| 014 | [finanzas-caja-mvp](014-finanzas-caja-mvp/spec.md) | Finanzas / caja MVP | done |
| 015 | [desvincular-dual](015-desvincular-dual/spec.md) | Desvincular perfil dual | done |
| 016 | [notas-internas-aislamiento](016-notas-internas-aislamiento/spec.md) | Aislamiento RTDB notas internas | done (retro, sin QA registrada) |
| 017 | [fallecido-archivar-recordatorios](017-fallecido-archivar-recordatorios/spec.md) | Fallecido → archivar recordatorios | done (retro, sin QA registrada) |
| 018 | [finanzas-csv-banio-caja](018-finanzas-csv-banio-caja/spec.md) | Finanzas CSV + link baño→caja | done (retro, sin QA registrada) |
| 019 | [deprecar-remove-ui](019-deprecar-remove-ui/spec.md) | Deprecar `.remove()` en servicios UI | done (retro, sin QA registrada) |
| 020 | [portal-mascotas-cliente-id](020-portal-mascotas-cliente-id/spec.md) | Query portal mascotas por `cliente_id` | done (retro, sin QA registrada) |
| 021 | [costos-rentabilidad-clinica](021-costos-rentabilidad-clinica/spec.md) | Costos y rentabilidad de clínica | done |
| 022 | [automatizacion-costos-dashboard](022-automatizacion-costos-dashboard/spec.md) | Automatización costos + ops financieras (hub) | done |
| 023 | [push-fcm-recordatorios](023-push-fcm-recordatorios/spec.md) | Push FCM desde recordatorios | done |
| 024 | [cfdi-preparacion](024-cfdi-preparacion/spec.md) | CFDI / SAT — preparación (fase controlada) | done |
| 025 | [metricas-servicios-dashboard](025-metricas-servicios-dashboard/spec.md) | Métricas por módulo + Dashboard dueño | done |
| 026 | [proveedores-menu-visibilidad](026-proveedores-menu-visibilidad/spec.md) | Proveedores visibles en menú admin | done |
| 027 | [menu-visibilidad-modulos](027-menu-visibilidad-modulos/spec.md) | Visibilidad de módulos ocultos en menú admin | done |
| 028 | [portal-banos-finanzas-servicio](028-portal-banos-finanzas-servicio/spec.md) | Portal baños read-only + Finanzas ingresos por servicio | done |
| 029 | [cliente-paciente-picker](029-cliente-paciente-picker/spec.md) | Cliente-Paciente Picker (regla global admin) | done |
| 030 | [meta-inversion-dashboard](030-meta-inversion-dashboard/spec.md) | Meta de inversión en dashboard dueño | done |
| 031 | [interconexion-modulos](031-interconexion-modulos/spec.md) | Interconexión de módulos (grafo clínico + ops) | done |
| 032 | [ticket-visita-saldo-cliente](032-ticket-visita-saldo-cliente/spec.md) | Ticket unificado por visita + saldo cliente (CxC) | done |
| 033 | [vacuna-recordatorio-auto](033-vacuna-recordatorio-auto/spec.md) | Vacuna → recordatorio automático de refuerzo | done |
| 034 | [alergias-cruzadas-mascota](034-alergias-cruzadas-mascota/spec.md) | Alergias cruzadas de la mascota | done |
| 035 | [staff-uid-acto](035-staff-uid-acto/spec.md) | Staff UID por acto clínico | done |
| 036 | [ticket-mejoras](036-ticket-mejoras/spec.md) | Mejoras ticket / visita / CxC (032 follow-up) | done |
| 037 | [consentimientos-clinicos](037-consentimientos-clinicos/spec.md) | Consentimientos clínicos | done |
| 038 | [resend-correo-portal](038-resend-correo-portal/spec.md) | Activar Resend — correo portal | done |
| 039 | [integridad-cobro-visita-caja](039-integridad-cobro-visita-caja/spec.md) | Integridad de cobro visita ↔ caja | done |
| 040 | [ticket-completo-por-cobrar-hoy](040-ticket-completo-por-cobrar-hoy/spec.md) | Ticket completo + Por cobrar hoy | done |
| 041 | [flujo-visita-del-dia](041-flujo-visita-del-dia/spec.md) | Flujo visita del día (post-cita) | done |
| 042 | [inventario-venta-ticket](042-inventario-venta-ticket/spec.md) | Venta inventario → ticket de visita | done |
| 043 | [producto-imagen-qr](043-producto-imagen-qr/spec.md) | Imagen y QR de producto + alta veterinaria | done |
| 044 | [producto-picker](044-producto-picker/spec.md) | Autocomplete unificado de producto | done |
| 045 | [visita-hub-pos-grid](045-visita-hub-pos-grid/spec.md) | Visita del día como ticket único + catálogo en cuadrícula | done |
| 046 | [ux-intuitiva-guiada](046-ux-intuitiva-guiada/spec.md) | UX intuitiva guiada (admin “como móvil”) | done |
| 047 | [enlace-portal-cliente-existente](047-enlace-portal-cliente-existente/spec.md) | Enlace portal ↔ cliente clínico (sin duplicar) | done (olas 1–3; deploy ola 3 pendiente OK Luis) |
| 048 | [modo-operacion-guiado](048-modo-operacion-guiado/spec.md) | Modo operación guiado (hints + POS inventario) | superseded → 054 (decisiones pendientes consolidadas en `specs/054-cierre-sistema/DECISIONES-PENDIENTES.md`) |
| 049 | [hub-operacion-menu](049-hub-operacion-menu/spec.md) | Hub operación y menú 3 mundos | superseded → 054 (decisiones pendientes consolidadas en `specs/054-cierre-sistema/DECISIONES-PENDIENTES.md`) |
| 050 | [unificacion-cobro](050-unificacion-cobro/spec.md) | Unificación de cobro (ticket del día) | superseded → 054 (decisiones pendientes consolidadas en `specs/054-cierre-sistema/DECISIONES-PENDIENTES.md`) |
| 051 | [login-auto-redirect](051-login-auto-redirect/spec.md) | Auto-redirect de login staff con sesión activa | done |
| 052 | [vacunas-esquemas-push-pwa](052-vacunas-esquemas-push-pwa/spec.md) | Vacunas — esquemas por especie, confirmación vet, push y PWA portal | done |
| 053 | [desparasitacion-esquemas](053-desparasitacion-esquemas/spec.md) | Desparasitación — esquemas sugeridos, confirmación vet y recordatorio | in_progress |
| 054 | [cierre-sistema](054-cierre-sistema/spec.md) | Cierre realista del producto KatzenVet Web | in_progress |
| 055 | [pos-movil-ticket](055-pos-movil-ticket/spec.md) | POS móvil — Punto de venta | in_progress |
| 056 | [servicios-clinica](056-servicios-clinica/spec.md) | Servicios de clínica | in_progress |
| 057 | [expediente-directorio-legacy](057-expediente-directorio-legacy/spec.md) | Expediente y directorio unificados (legacy) | done |
| 058 | [ficha-directorio-dblclick](058-ficha-directorio-dblclick/spec.md) | Ficha rápida al doble clic (Directorio) | done |
| 059 | [dialogos-admin-layout-responsivo](059-dialogos-admin-layout-responsivo/spec.md) | Layout responsivo de diálogos admin (regla permanente) | in_progress |
| 060 | [modal-portal-instantaneo](060-modal-portal-instantaneo/spec.md) | Modal portal instantáneo en landing | in_progress |
| 061 | [admin-paginas-layout-responsivo](061-admin-paginas-layout-responsivo/spec.md) | Layout responsivo de páginas admin (regla permanente) | in_progress |
| 062 | [cliente-mascota-abrir-expediente](062-cliente-mascota-abrir-expediente/spec.md) | Abrir expediente desde mascota en ficha de cliente | done |
| 063 | [hosting-una-version](063-hosting-una-version/spec.md) | Hosting sin historial de releases (una versión live) | done |
| 064 | [migracion-pdv-firebird](064-migracion-pdv-firebird/spec.md) | Migración PDV Firebird (Eleventa) → KatzenVet | in_progress |
| 065 | [pos-venta-rapida-guiada](065-pos-venta-rapida-guiada/spec.md) | POS — venta rápida guiada | done |
| 066 | [whatsapp-recordatorios-metrica-uso](066-whatsapp-recordatorios-metrica-uso/spec.md) | Recordatorio por WhatsApp + métrica de uso por módulo | done |
| 067 | [respaldo-rtdb](067-respaldo-rtdb/spec.md) | Respaldo semanal de RTDB a Cloud Storage | done |

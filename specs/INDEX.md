# Índice de specs — KatzenVet

> **Autogenerado** por `node scripts/specs-index.mjs` a partir de `specs/NNN-*/spec.md`. **No editar a mano**: cambia el `Estado:` en la spec y regenera.
>
> Memoria / proceso: [`agent-guardrails`](memory/agent-guardrails.md) · [`module-map`](memory/module-map.md) · specs vivas **[078](078-plan-automatizacion-y-specs-vivas/spec.md)** · [`PLAN-UX`](PLAN-UX-VETERINARIAS.md) · [`ROADMAP`](ROADMAP.md)

Total: **116** specs · `done`: 87 · `in_progress`: 17 · `implementado`: 4 · `sin`: 4 · `superseded`: 3 · `código`: 1

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
| 068 | [numero-expediente-visible](068-numero-expediente-visible/spec.md) | Número de expediente visible en ficha de paciente | done |
| 069 | [fase1-quitar-friccion](069-fase1-quitar-friccion/spec.md) | Fase 1 — Quitar fricción operativa | done |
| 070 | [fase2-flujos-guiados](070-fase2-flujos-guiados/spec.md) | Fase 2 — Flujos guiados | done |
| 071 | [fase3-caja-automatica](071-fase3-caja-automatica/spec.md) | Fase 3 — Caja y finanzas automáticas | done |
| 072 | [fase4-hoy-roles-onboarding](072-fase4-hoy-roles-onboarding/spec.md) | Fase 4 — Hoy, roles y onboarding | in_progress |
| 073 | [doble-clic-fila-detalle](073-doble-clic-fila-detalle/spec.md) | Doble clic en fila = Ver detalle (tablas admin) | done |
| 074 | [portal-experiencia-cliente](074-portal-experiencia-cliente/spec.md) | Portal — experiencia de dueño | in_progress |
| 075 | [modularidad-y-memoria-agentes](075-modularidad-y-memoria-agentes/spec.md) | Modularidad y memoria para agentes | done |
| 076 | [modularizacion-pos-core](076-modularizacion-pos-core/spec.md) | Modularización POS / Core (oleada 2) | done |
| 077 | [modularizacion-pos-pacientes](077-modularizacion-pos-pacientes/spec.md) | Modularización POS sheets + pacientes (oleada 3) | done |
| 078 | [plan-automatizacion-y-specs-vivas](078-plan-automatizacion-y-specs-vivas/spec.md) | Plan de automatización y specs vivas | done |
| 079 | [modularizacion-pos-orquestacion](079-modularizacion-pos-orquestacion/spec.md) | Modularización POS orquestación (oleada 4) | done |
| 080 | [modularizacion-pos-persistir](080-modularizacion-pos-persistir/spec.md) | Modularización POS persistir / kits-stock (oleada 5) | done |
| 081 | [modularizacion-pos-sheets](081-modularizacion-pos-sheets/spec.md) | Modularización POS sheets como componentes (oleada 6) | done |
| 082 | [modularizacion-pos-sheet-carrito](082-modularizacion-pos-sheet-carrito/spec.md) | Modularización POS sheet carrito (oleada 7) | done |
| 084 | [ui-ux-oleada-impacto](084-ui-ux-oleada-impacto/spec.md) | UI/UX oleada de impacto (post PLAN-UX 1–4) | done |
| 085 | [peluqueria-flujo-facil](085-peluqueria-flujo-facil/spec.md) | Peluquería — flujo fácil + precios claros | in_progress |
| 086 | [clinicos-cola-cobrar](086-clinicos-cola-cobrar/spec.md) | Vacunas y consultas → cola de cobro (mismo molde peluquería) | in_progress |
| 087 | [pwa-dual-portal-clinica](087-pwa-dual-portal-clinica/spec.md) | PWA dual — portal dueños vs app clínica (staff) | done |
| 088 | [fix-borrar-personal-auth-missing](088-fix-borrar-personal-auth-missing/spec.md) | Fix borrar personal cuando no hay cuenta Auth | done |
| 089 | [pension-tarifas-y-flujo](089-pension-tarifas-y-flujo/spec.md) | Pensión — tarifas oficiales y flujo de alta (Fase 0+) | done |
| 090 | [datepicker-canonico](090-datepicker-canonico/spec.md) | Datepicker canónico (selección de fecha) | done |
| 091 | [pos-riel-pension](091-pos-riel-pension/spec.md) | POS — riel Pensión (enlace al cobro) | done |
| 092 | [ticket-digital-pdf-whatsapp](092-ticket-digital-pdf-whatsapp/spec.md) | Ticket digital (CSS imprimible + PDF + WhatsApp) | done |
| 093 | [taxonomia-servicios-clinica](093-taxonomia-servicios-clinica/spec.md) | Taxonomía de servicios de clínica (tipo + domicilio) | done |
| 094 | [consentimientos-pdf-plantillas-whatsapp](094-consentimientos-pdf-plantillas-whatsapp/spec.md) | Consentimientos — PDF, plantillas y WhatsApp | in_progress |
| 095 | [movil-usable](095-movil-usable/spec.md) | Panel admin usable en celular | in_progress |
| 096 | [simplificar-acciones](096-simplificar-acciones/spec.md) | Menos botones, una acción principal por pantalla | in_progress (F1–F4 hechas salvo lo marcado) |
| 097 | [filtros-agenda](097-filtros-agenda/spec.md) | 097 — Filtros de agenda en Citas, Peluquería y Pensión | done (2026-10-26) · **Nivel:** L2 (UI + util, solo lectura) · **Pidió:** Luis |
| 098 | [corte-caja-fechas](098-corte-caja-fechas/spec.md) | 098 — Corte de caja y fechas tecleadas | done (2026-10-26) · **Nivel:** L2/L3 (escrituras de caja aditivas) · **Pidió/autorizó:** Luis |
| 099 | [etapa1-avisos-alertas](099-etapa1-avisos-alertas/spec.md) | 099 — Etapa 1: avisos push confiables y alertas de inventario sin ruido | in_progress (2026-10-26) · **Nivel:** L2 (sin cambios de datos; SW + UI) · **Pidió:** Luis («va hazlo y arranca») |
| 100 | [tarifas-peluqueria-servicios](100-tarifas-peluqueria-servicios/spec.md) | 100 — Tarifas de peluquería y servicios fuera del inventario | in_progress (2026-10-26) · **Nivel:** L2 código + L3 datos (migración con OK de Luis) · **Pidió:** Luis |
| 101 | [ux-caja-inventario](101-ux-caja-inventario/spec.md) | 101 — Caja e Inventario más fáciles de entender (parte 1) | done (2026-10-26) · **Nivel:** L2 (solo UI/lógica de lectura, sin cambios en RTDB) · **Pidió:** Luis («siento que está un poco complicada o confusa») |
| 102 | [ux-fase2-finanzas-inventario](102-ux-fase2-finanzas-inventario/spec.md) | 102 — Finanzas en 3 pestañas e Inventario con buscador y «Por pedir» (fase 2) | done (2026-10-26) · **Nivel:** L2 (solo UI/lectura; sin cambios en RTDB) · **Pidió:** Luis («haz el siguiente, continúa con lo pendiente») |
| 103 | [alta-rapida-producto](103-alta-rapida-producto/spec.md) | 103 — Alta rápida de producto (5 campos) | done (2026-10-26) · **Nivel:** L1/L2 (solo UI; mismo guardado que antes) · **Pidió:** Luis («sí, haz la fase 2») |
| 104 | [buscar-por-mascota](104-buscar-por-mascota/spec.md) | 104 — Buscar siempre por la mascota (el dueño se llena solo) | done (2026-10-26) · **Nivel:** L2 (componente compartido `app-cliente-paciente-picker`; sin cambios en RTDB) · **Pidió:** Luis («las veterinarias conocen al paciente pero no al dueño») |
| 105 | [buscador-mascota-estandar](105-buscador-mascota-estandar/spec.md) | 105 — Buscador de mascota igual en todos los módulos | done (2026-10-26) · **Nivel:** L1/L2 (solo cómo se muestra; sin cambios en RTDB) · **Pidió:** Luis («que todo esté estandarizado») |
| 107 | [domicilios](107-domicilios/spec.md) | 107 — Domicilios: cotizador, configuración e historial con métricas | done (2026-10-27) · **Nivel:** L3 (campos aditivos en Baño/Cita/Visita + `Katzen/Finanzas/TarifasDomicilio`) · **Pidió:** Luis · **OK de Luis: 2026-10-27 00:04 («si va»)** |
| 108 | [domicilios-pantalla](108-domicilios-pantalla/spec.md) | 108 — Pantalla propia de Domicilios | done (2026-10-27) · **Nivel:** L2 (UI; mismos datos de la spec 107) · **Pidió:** Luis («algo así como lo de peluquería… rápido y pronto, y ahí mismo poner el costo de la gasolina») |
| 109 | [etapa-a-menos-captura](109-etapa-a-menos-captura/spec.md) | 109 — Etapa A: menos captura doble | done (2026-10-27) · **Nivel:** L2 (UI; usa los mismos guardados de siempre) · **Pidió:** Luis (análisis UX → «empiezas con la Etapa A») |
| 110 | [peluqueria-varias-mascotas](110-peluqueria-varias-mascotas/spec.md) | Spec 110 — Peluquería: varias mascotas, hora, precio al final y cepillado | implementado · **Nivel:** L2 (UI/lógica, sin cambios de reglas ni nodos nuevos) |
| 111 | [para-avisar-hoy](111-para-avisar-hoy/spec.md) | Spec 111 — Etapa B: «Para avisar hoy» | implementado · **Nivel:** L2 (UI/lógica; campos opcionales aditivos; sin nodos, reglas ni functions) · **Pidió:** Luis (2026-10-27, «continua con la etapa b… no pegarle ni modificar cosas que ya funcionan») |
| 112 | [pausa-avisos-dueno](112-pausa-avisos-dueno/spec.md) | Spec 112 — Pausa de avisos automáticos al dueño (interruptor) | código listo · deploy de `functions:fcm` lo corre Luis · **Nivel:** L3 (functions) · **Pidió:** Luis (2026-10-27: «que aún no se manden automáticamente porque seguimos en pruebas»; autorizó revisar y pausar) |
| 113 | [etapa-c-hoy-trabajo](113-etapa-c-hoy-trabajo/spec.md) | Spec 113 — Etapa C: Hoy como lista de trabajo y pantallas más claras | implementado · **Nivel:** L2 (solo UI; sin datos) · **Pidió:** Luis (2026-10-27, «continua ahorita» con la Etapa C del documento de análisis) |
| 114 | [etapa-d-datos-una-vez](114-etapa-d-datos-una-vez/spec.md) | Spec 114 — Etapa D (parte sin tocar datos viejos): datos que faltan una vez y cliente repetido | implementado · **Nivel:** L2 · **Pidió:** Luis (2026-10-27 «continua ahorita») |
| 115 | [revision-bugs-graves](115-revision-bugs-graves/spec.md) | Spec 115 — Bugs graves de la revisión del 29 oct 2026 | sin Estado |
| 116 | [expediente-clinico](116-expediente-clinico/spec.md) | Spec 116 — Expediente clínico: fotos, receta y cobro al terminar | sin Estado |
| 117 | [campanita-avisos](117-campanita-avisos/spec.md) | Spec 117 — Campanita de avisos en la barra superior | sin Estado |
| 118 | [uso-dia-a-dia](118-uso-dia-a-dia/spec.md) | Spec 118 — Uso del día a día (puntos 2 y 3 de la revisión) | sin Estado |

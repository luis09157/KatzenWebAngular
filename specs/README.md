# Spec-Driven Development — KatzenVet

Este directorio es la **fuente de verdad** para features y módulos nuevos.

## Estructura

```
specs/
├── memory/
│   ├── constitution.md        # Principios del proyecto
│   └── domain-context.md      # Entidades, reglas de negocio, RTDB (dominio Katzen)
├── AUDIT-CODE.md              # Auditoría técnica viva (hallazgos, gaps, prioridades)
├── ROADMAP.md                 # Plan maestro SDD
├── templates/                 # Plantillas para copiar
│   ├── module-spec.template.md
│   ├── module-plan.template.md
│   ├── module-tasks.template.md
│   └── qa-validation-guide.md # Guía QA exhaustiva (obligatoria al cerrar)
├── 001-baseline/              # Snapshot del producto
├── 002-portal-clientes-usuarios/
├── 003-validacion-agenda-citas/  # Agenda: vet, duración, solape, cancelación
├── 004-timepicker-dialog/        # Timepicker Material (reemplazo type=time)
├── 005-loading-feedback-ux/      # Loading contextual + overlay no trabado
├── 006-revocacion-sesiones-portal/ # revokeRefreshTokens al desactivar portal
├── 007-politica-mermas-inventario/ # Bloqueo stock negativo, motivo merma, ajuste supervisor
├── 008-rtdb-permisos-granulares/   # Histórico: writes por staffRole (supersedido por 011)
├── 009-cascada-baja-cliente/       # Baja cliente → mascotas/citas/portal
├── 010-notas-internas-historial/   # notas_internas aditivo (MVP admin)
├── 011-staff-acceso-admin-unificado/ # Todo staff = acceso admin operativo
├── 012-perfiles-dual-y-duenas/       # Matriz perfiles, dual post-login, vincular portal
├── 013-registro-portal-cliente-landing/ # Auto-provision alta + self-registro landing
├── 014-finanzas-caja-mvp/            # Caja MVP + (018) CSV / baño→caja
├── 015-desvincular-dual/             # Unlink staff↔portal
├── 016-notas-internas-aislamiento/   # Nodo staff-only Historiales_Notas_Internas
├── 017-fallecido-archivar-recordatorios/
├── 018-finanzas-csv-banio-caja/
├── 019-deprecar-remove-ui/
├── 020-portal-mascotas-cliente-id/   # Rules query cliente_id
├── 021-costos-rentabilidad-clinica/  # Plantillas costo + margen caja + P&L día/mes
├── 022-automatizacion-costos-dashboard/ # **done** A–E: valuación + baño/venta→caja + historial/pensión + gráficas + egresos + OC→egreso
├── 023-push-fcm-recordatorios/          # **done** MVP CF push + FcmTokens
├── 024-cfdi-preparacion/                # **done** datos fiscales; sin PAC
├── 025-metricas-servicios-dashboard/    # KPIs por módulo + dashboard dueño `/admin/inicio`
├── 026-proveedores-menu-visibilidad/    # Proveedores en sidenav + enlace desde producto
├── 027-menu-visibilidad-modulos/        # Sub-ítems inventario en sidenav (026 follow-up)
├── 028-portal-banos-finanzas-servicio/  # Portal baños read-only + tab ingresos por servicio
├── 031-interconexion-modulos/           # **done** grafo IDs + atajos + portal pensión/recordatorios
├── 032-ticket-visita-saldo-cliente/     # **done** ticket visita + CxC + portal visitas
├── 033-vacuna-recordatorio-auto/       # **done** vacuna → recordatorio refuerzo
├── 034-alergias-cruzadas-mascota/      # alergias canónicas + alertas cruzadas + portal
├── 035-staff-uid-acto/                 # **done** staff UID/nombre por acto clínico
├── 036-ticket-mejoras/                 # mejoras ticket (filtros, print, presets, CxC)
├── 037-consentimientos-clinicos/       # **done** consentimientos admin + portal
├── 043-producto-imagen-qr/            # foto opcional + QR + presets clínica
├── 044-producto-picker/               # autocomplete unificado de producto
├── 045-visita-hub-pos-grid/           # cuenta del día (ticket) + grid productos
├── 046-ux-intuitiva-guiada/           # UX móvil: “te falta X”, walk-in, empty states
├── 047-enlace-portal-cliente-existente/ # portal en ficha + self-reg correo/teléfono (ola 3 confirm)
├── 051-login-auto-redirect/            # auto-entrada /admin/login con sesión Firebase
├── 052-vacunas-esquemas-push-pwa/      # esquemas vacunación + push + PWA (olas 1–3; spec done)
├── 053-desparasitacion-esquemas/       # desparasitación ola 1 (motor + confirm + recordatorio)
├── 054-cierre-sistema/                 # cierre operable P0/P1/P2 · CIERRE.md
├── 055-pos-movil-ticket/               # Caja POS mobile-first (ola 1)
├── 056-servicios-clinica/              # Catálogo servicios con precio (ola 1; baño sigue en 022)
├── 057-expediente-directorio-legacy/   # misma lista Buscar/Directorio + clientes/historial legacy
├── 058-ficha-directorio-dblclick/      # doble clic Directorio → modal ficha + expediente resumido
├── 059-dialogos-admin-layout-responsivo/ # regla permanente layout diálogos admin (padding, tabs, entity-summary)
├── 060-modal-portal-instantaneo/       # overlay login portal en landing sin esperar Auth
└── NNN-nombre-feature/        # Una carpeta por entrega
    ├── spec.md                # QUÉ y POR QUÉ (sin código)
    ├── plan.md                # CÓMO (archivos, RTDB, functions)
    └── tasks.md               # Checklist verificable + testing
```

## Flujo para un módulo o feature nueva

### 1. Crear spec (humano o IA)

```bash
mkdir -p specs/003-mi-modulo
cp specs/templates/module-spec.template.md specs/003-mi-modulo/spec.md
cp specs/templates/module-plan.template.md specs/003-mi-modulo/plan.md
cp specs/templates/module-tasks.template.md specs/003-mi-modulo/tasks.md
# Editar spec.md con user stories y criterios SC-001, SC-002...
```

### 2. Plan técnico

Completar `plan.md`: rutas, nodos RTDB, servicios, componentes, reglas, functions. Consultar `specs/memory/domain-context.md` para entidades y reglas de negocio existentes.

Usar **Plan Mode** en Cursor (Shift+Tab) y guardar el resultado en `plan.md`.

### 3. Implementar en Cursor

Prompt sugerido:

```
Implementa specs/003-mi-modulo/ siguiendo spec.md y plan.md.
Respeta specs/memory/constitution.md, specs/memory/domain-context.md y AGENTS.md.
Marca tasks.md al avanzar.
```

Adjuntar con `@specs/003-mi-modulo/spec.md`.

### 4. Verificar (pre-entrega obligatoria — la hace el agente)

**El agente ejecuta todas las validaciones de forma autónoma; el usuario no es el QA por defecto.**

1. Aplicar **`specs/templates/qa-validation-guide.md` completo** (formularios, modales, edge cases, chips, pickers, loading, timepicker, build).
2. Ejecutar y reportar `npm run build` (exit 0).
3. Asegurar `npm start` vivo en http://localhost:4200 + smoke visual de lo tocado.
4. Registrar resultados en la sección **Testing y validación exhaustiva** de `tasks.md` **antes** de marcar `[x]`.
5. Ejecutar el resto de **Testing** en `tasks.md` (Cypress si aplica) solo con evidencia registrada.

Regla Cursor: `.cursor/rules/sdd-workflow.mdc` → **Validación pre-entrega (obligatoria)**.

### 5. Cerrar

En `spec.md` cambiar `Estado: draft` → `Estado: done` y fecha — **solo** cuando la validación pre-entrega esté registrada.

## Convención de nombres

| Prefijo | Uso |
|---------|-----|
| `001-`, `002-` | Orden cronológico, no semver |
| `kebab-case` | `portal-clientes-usuarios`, `inventario-alertas-email` |

## Specs existentes

| ID | Feature | Estado |
|----|---------|--------|
| 001 | Baseline producto | done |
| 002 | Portal clientes en Usuarios | done |
| 003 | Validación agenda citas | done |
| 004 | Timepicker dialog | done — timepicker obligatorio en campos hora (pre-entrega) |
| 005 | Loading feedback UX | done — loading contextual / overlay no trabado (pre-entrega en async admin) |
| 052 | Vacunas: esquemas por especie + push anti-spam + PWA | **done** (olas 1–3; deploy scheduler FCM pendiente) |
| 053 | Desparasitación: esquemas + confirmación + recordatorio | **in_progress** (ola 1 código; ola 2 listado/ticket) |
| 054 | Cierre operable del producto | **in_progress** — [`CIERRE.md`](054-cierre-sistema/CIERRE.md) |
| 055 | POS móvil Ticket del día | **in_progress** — ola 1 UI celular; olas 2 scanner / 3 atajos |
| 058 | Ficha rápida al doble clic (Directorio) | done |
| 059 | Layout responsivo de diálogos admin (regla UI permanente) | **in_progress** — padding/tabs/entity-summary |
| 060 | Modal portal instantáneo en landing | **in_progress** — overlay sin esperar Auth |

## Reglas Cursor relacionadas

- `.cursor/rules/sdd-workflow.mdc` — flujo SDD (always apply)
- `.cursor/rules/new-admin-module.mdc` — crear módulos admin
- `.cursor/rules/admin-ui-architecture.mdc` — diseño UI
- `.cursor/rules/angular-firebase.mdc` — Angular + servicios
- `.cursor/rules/cloud-functions.mdc` — Functions
- `.cursor/rules/rtdb-rules.mdc` — Reglas RTDB

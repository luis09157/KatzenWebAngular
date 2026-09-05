# Plan de trabajo — SDD KatzenVet

Plan para adoptar Spec-Driven Development y mantener el sistema al crecer.

---

## Fase 1 — Infraestructura SDD ✅ cumplida (2026-08-25)

Constitución, `AGENTS.md`, plantillas, baseline 001, retro-spec 002, rules Cursor y `specs/README.md` en su lugar. Proceso vigente con niveles L1/L2/L3: `.cursor/rules/sdd-workflow.mdc`.

---

## Deuda técnica (AUDIT-CODE)

Auditoría integral del codebase (2026-08-25): [`specs/AUDIT-CODE.md`](AUDIT-CODE.md). Documento vivo — actualizar tras cerrar ítems con spec/PR.

**Top 3 prioridades inmediatas:**

1. ~~**RTDB granular por rol**~~ — **hecho en repo** `specs/008-rtdb-permisos-granulares/` (`database.rules.json`); **deploy database pendiente** (confirmar con Luis / smoke móvil).
2. ~~**Validación agenda citas**~~ — **hecho** en `specs/003-validacion-agenda-citas/` (vet obligatorio, solape, duración 30, motivo cancelación, fechas pasadas / revert por rol).
3. ~~**`revokeRefreshTokens`** en `deactivatePortalClient`~~ — **hecho** en `specs/006-revocacion-sesiones-portal/` (**deploy Functions OK** 2026-08-25).

**UI reciente:**
- `specs/004-timepicker-dialog/` — timepicker Material estándar (`app-timepicker-field`) reemplaza `type="time"` en citas, baños y recordatorios.
- `specs/005-loading-feedback-ux/` — mensajes contextuales en `LoadingService` + fix overlay trabado al guardar citas.
- `specs/009-cascada-baja-cliente/` — baja cliente en cascada (mascotas, citas futuras, portal).
- `specs/010-notas-internas-historial/` — campo aditivo `notas_internas` (MVP admin; portal no lo mapea).

---

## Fase 2 — Retro-documentar módulos críticos ✅ cumplida

Los módulos base (clientes, pacientes, citas, inventario, portal) quedaron documentados en `specs/001-baseline/` y `specs/memory/domain-context.md`; las mejoras posteriores tienen su propia spec (ver `specs/INDEX.md`). No existen carpetas `010-clientes` / `011-pacientes`: esos números se usaron para otras features.

## Fase 3 — Plantilla “nuevo módulo admin” ✅ cumplida

Plantillas de `specs/templates/` probadas desde la spec 003 en adelante; checklist de módulo nuevo en `.cursor/rules/new-admin-module.mdc`.

---

## Fase 4 — Operación continua

| Práctica | Frecuencia |
|----------|------------|
| Nueva feature → carpeta `specs/NNN-*` antes de code | Siempre |
| Actualizar spec si cambia alcance | En la misma sesión |
| Revisar constitution al tocar Auth/RTDB | Siempre |
| Deploy functions documentado en spec | Cada callable nuevo |
| Opcional: GitHub Spec Kit (`specify init`) | Si el equipo crece |

---

## Fase 5 — Testing ampliado (backlog)

| Item | Descripción |
|------|-------------|
| E2E portal login + cambio password | `cypress/e2e/portal-guest.cy.ts` + `portal-auth-smoke.cy.ts` (`npm run cy:portal`) — auth skip sin `portalEmail`/`portalPassword` |
| E2E usuarios portal (activar/reenviar) | mock o staging |
| Unit tests servicios críticos | `portal-clientes.service`, `auth-profile` |

---

## Fase 6 — Features de dominio (backlog, sin fechas)

**Prioridad actual (2026-09-04):** el backlog de producto se ordena por `specs/PLAN-UX-VETERINARIAS.md` (usabilidad para veterinarias sin perfil técnico: flujos guiados, caja automática, menú por rol, onboarding). Lo de abajo se toma solo si no choca con ese plan.

Derivado de `specs/memory/domain-context.md` §11–12. Crear spec `specs/NNN-*` antes de implementar.

| Área | Feature | Prioridad sugerida |
|------|---------|-------------------|
| **Finanzas / caja / ops** | **014/018/021** hechos. **022 done (A–E):** valuación + baño/venta→caja + historial/vacuna + pensión pulida + gráficas + egresos + **OC→egreso**. — `specs/022-automatizacion-costos-dashboard/` | Media — **cerrada** |
| **Notificaciones** | ~~Push Firebase desde recordatorios~~ **023 MVP** (`onRecordatorioWritePush` codebase **fcm** + FcmTokens). Deploy FCM **sin Resend** vía `functions-fcm/`. | Alta — **MVP hecho** |
| **Historial clínico** | ~~Notas internas solo médicos~~ **MVP 010**; ~~aislamiento RTDB~~ **016** nodo staff-only. ~~`medico_atendio` obligatorio~~ hecho | Media |
| **Inventario** | Salida ligada a historial para medicamentos controlados; ~~política mermas~~ **Hecho (MVP 007)**; ~~Proveedores visibles en menú~~ **026**; ~~sub-ítems inventario en sidenav~~ **027**; ~~**043** foto + QR~~ **done**; ~~**044** picker producto~~ **done**; ~~**045** grid catálogo~~ **done** | Media |
| **Portal / auth** | ~~Registro self-service landing~~ **013**; ~~UI perfil dual~~ **012**; ~~desvincular dual~~ **015**; ~~revocación sesiones~~ **hecho + deploy OK**; ~~query mascotas cliente_id~~ **020**; ~~portal baños~~ **028**; ~~interconexión + pensión/recordatorios portal~~ **031**; ~~**047** enlace portal↔ficha clínica (ola 1–2)~~ **done**; **ola 3 teléfono** código listo (confirmación, no auto-vínculo; deploy functions **OK Luis**); **Cypress portal** guest + auth (skip sin env) | Alta |
| **Ops / enlaces** | **031 done:** prefill baños, expediente→cita/pensión, cita→caja, stock→OC, KPI links, FCM token SW-ready | Alta — **cerrada** |
| **Finanzas / CxC** | **032/036 done.** ~~**045** hub ticket (cuenta del día + pendientes baño + venta desde ticket)~~ **done**. Walk-in petshop → **046 done**. | Alta |
| **UX admin** | ~~**046** draft: flujos guiados “te falta X”, empty states, walk-in~~ **done** — `specs/046-ux-intuitiva-guiada/` | Alta — **cerrada** |
| **Ops recepción** | **048/049/050** superseded → **054** (decisiones Luis en `054-cierre-sistema/DECISIONES-PENDIENTES.md`). **054:** wizard ticket. **055:** POS móvil + precios inventario. **056:** catálogo Servicios de clínica + costo/IVA/ganancia (precio al público incluye IVA; sin deploy). | Alta |
| **Ops clínicas** | **033–037 done**. **052 done** (código olas 1–3). **053 ola 1 hecha** (desparasitación → recordatorio). Scheduler functions-fcm `onVacunaPushSchedule` **desplegado 2026-09-04** (autorizado Luis). Cierre: `specs/054-cierre-sistema/CIERRE.md`. | Alta |
| **Roles / plataforma** | Rol **super admin / dueño**; ~~RTDB granular~~ **008 en repo** | Media |
| **Integraciones** | WhatsApp / agendas (FB contacto); ContactosWeb automatización (saludo, seguimiento) | Baja |
| **Operación / citas** | ~~Cascada baja lógica cliente~~ **MVP 009**; ~~archivo automático recordatorios (mascota Fallecido)~~ **017**; ~~validación agenda~~ hecho 003; ~~deprecar .remove UI~~ **019** | Media |
| **Fiscal** | **024** preparación CFDI (datos fiscales cliente; **sin PAC/timbrar** hasta OK Luis) — `specs/024-cfdi-preparacion/` | Media — fase 1 |
| **Plataforma** | Multi-sucursal; migración nodos legacy inventario (coordinar móvil); ~~dashboard KPIs centralizado~~ **025 done** (`/admin/inicio` dueño + KPIs por módulo) | Media — **cerrada** |

---

## Resend / correos portal

**Activado 2026-08-26** (`specs/038-resend-correo-portal/`): secret `RESEND_API_KEY` + deploy de callables portal. Pendiente: smoke modo prueba (inbox cuenta Resend, Luis) y **dominio propio + `PORTAL_FROM_EMAIL`** para clientes reales (Fase B — `specs/038-resend-correo-portal/FASE-B-DOMINIO.md`). Resumen: `specs/038-resend-correo-portal/notas-resend.md`.

---

## Cómo pedir un módulo nuevo (para ti)

Mensaje tipo:

> Quiero un módulo **X** para **Y** (ej. recordatorios SMS para citas).
> Crea la spec en `specs/00N-X/` e impleméntala.

El agente debe:

1. Crear spec/plan/tasks
2. Mostrarte el plan para confirmar alcance
3. Implementar solo lo acordado
4. Ejecutar build + tests de la spec
5. Dejar deploy como paso manual salvo que lo pidas

---

## Métricas de éxito SDD

| Métrica | Estado 2026-09-04 |
|---------|-------------------|
| Toda feature nueva tiene carpeta en `specs/` | ✅ (64 specs; índice `specs/INDEX.md`) |
| Callables usados en frontend con function desplegada | ✅ scheduler FCM 052 `onVacunaPushSchedule` **desplegado 2026-09-04**; pendiente autorizado por Luis: `registerPortalOwner` ola 3 de 047 |
| UI admin sin regresiones en `npm run cy:admin` | ✅ al cierre 2026-08-26 (`QA-CRUD-MATRIX.md`); re-correr solo al tocar rutas admin (L2 con ruta nueva) |
| Mensajes de error legibles (`ErrorMessagesService`) | ✅ patrón obligatorio en constitution §3 |

# Plan de trabajo — SDD KatzenVet

Plan para adoptar Spec-Driven Development y mantener el sistema al crecer.

---

## Fase 1 — Infraestructura SDD ✅ (esta entrega)

| Tarea | Entregable | Estado |
|-------|------------|--------|
| Constitución del proyecto | `specs/memory/constitution.md` | ✅ |
| Guía agentes | `AGENTS.md` | ✅ |
| Plantillas spec/plan/tasks | `specs/templates/` | ✅ |
| Baseline producto | `specs/001-baseline/spec.md` | ✅ |
| Retro-spec portal usuarios | `specs/002-portal-clientes-usuarios/` | ✅ |
| Rules Cursor SDD + dominio | `.cursor/rules/*.mdc` | ✅ |
| README specs | `specs/README.md` | ✅ |

**Testing fase 1:** revisar que Cursor carga rules; abrir chat con `@AGENTS.md` y `@specs/memory/constitution.md`.

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

## Fase 2 — Retro-documentar módulos críticos (1–2 semanas)

Prioridad para tener specs antes de refactorizar:

| Orden | Módulo | Carpeta spec | Cypress existente |
|-------|--------|--------------|-------------------|
| 1 | Clientes | `specs/010-clientes/` | `admin-crud-clientes.cy.ts` |
| 2 | Pacientes / expediente | `specs/011-pacientes/` | `paciente-smoke.cy.ts` |
| 3 | Citas | `specs/012-citas/` | en `admin-modules-authenticated` |
| 4 | Inventario | `specs/013-inventario/` | parcial |
| 5 | Portal dueños | `specs/014-portal/` | manual |

**Por cada módulo:** copiar template → documentar rutas RTDB → listar criterios SC → enlazar tests Cypress.

---

## Fase 3 — Plantilla “nuevo módulo admin” probada (cuando toque feature nueva)

Usar `specs/templates/` para el **próximo módulo real** que pidas (ej. campañas, reportes, facturación).

Checklist automático en `tasks.md`:

1. `StaffModule` + routing + guard
2. UI admin pattern (clientes como ref)
3. RTDB rules si hay escritura
4. Function callable si hay lógica sensible
5. Entrada Cypress en `admin-modules-authenticated.cy.ts`
6. `npm run build` + `npm run cy:admin`

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
| E2E portal login + cambio password | `cypress/e2e/portal-*.cy.ts` |
| E2E usuarios portal (activar/reenviar) | mock o staging |
| Unit tests servicios críticos | `portal-clientes.service`, `auth-profile` |

---

## Fase 6 — Features de dominio (backlog, sin fechas)

Derivado de `specs/memory/domain-context.md` §11–12. Crear spec `specs/NNN-*` antes de implementar.

| Área | Feature | Prioridad sugerida |
|------|---------|-------------------|
| **Finanzas / caja / ops** | **014/018/021** hechos. **022** (draft): wire inventario↔caja, defaults baño por tamaño, consumo historial, gráficas semana/mes, egresos tipificados — **sin módulos nuevos** (`specs/022-automatizacion-costos-dashboard/`) | Alta — **siguiente: aprobar e implementar 022** |
| **Notificaciones** | Push Firebase desde recordatorios (y extensión citas/portal) | Alta |
| **Historial clínico** | ~~Notas internas solo médicos~~ **MVP 010**; ~~aislamiento RTDB~~ **016** nodo staff-only. ~~`medico_atendio` obligatorio~~ hecho | Media |
| **Inventario** | Salida ligada a historial para medicamentos controlados; ~~política mermas~~ **Hecho (MVP 007)** — autorización dual formal pendiente | Media |
| **Portal / auth** | ~~Registro self-service landing~~ **013**; ~~UI perfil dual~~ **012**; ~~desvincular dual~~ **015**; ~~revocación sesiones~~ **hecho + deploy OK**; ~~query mascotas cliente_id~~ **020** | Media |
| **Roles / plataforma** | Rol **super admin / dueño**; ~~RTDB granular~~ **008 en repo** | Media |
| **Integraciones** | WhatsApp / agendas (FB contacto); ContactosWeb automatización (saludo, seguimiento) | Baja |
| **Operación / citas** | ~~Cascada baja lógica cliente~~ **MVP 009**; ~~archivo automático recordatorios (mascota Fallecido)~~ **017**; ~~validación agenda~~ hecho 003; ~~deprecar .remove UI~~ **019** | Media |
| **Plataforma** | Multi-sucursal; migración nodos legacy inventario (coordinar móvil); dashboard KPIs centralizado | Baja–media |

---

## Al final — Resend / correos portal (diferido)

**Decisión Luis (2026-08-26):** configurar correo **después** de cerrar el resto del backlog de producto. No bloquear features ni deploys de UI por Resend.

| Paso final | Acción |
|------------|--------|
| 1 | `firebase functions:secrets:set RESEND_API_KEY` (+ dominio verificado / `PORTAL_FROM_EMAIL` si aplica) |
| 2 | Deploy functions portal: `provisionPortalClient`, `resendPortalClientAccess`, `registerPortalOwner` (+ `unlinkStaffPortalCliente` si sigue pendiente por el secret) |
| 3 | Smoke entrega real (modo prueba → email cuenta Resend; luego clientes con dominio) |

Detalle operativo: `specs/QA-CRUD-MATRIX.md` · `AGENTS.md`.

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

- [ ] Toda feature nueva tiene carpeta en `specs/`
- [ ] Cero callables en frontend sin function desplegada (checklist deploy)
- [ ] UI admin sin regresiones en `npm run cy:admin`
- [ ] Mensajes de error legibles (no `"internal"` crudo)

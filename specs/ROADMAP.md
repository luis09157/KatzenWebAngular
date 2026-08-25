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

1. **RTDB granular por rol** — reglas `database.rules.json` alineadas con `staff-role.config.ts` (historiales, inventario).
2. **Validación agenda citas** — veterinario obligatorio, solapamiento por vet, `duracion_minutos` default 30 min.
3. **`revokeRefreshTokens`** en `deactivatePortalClient` — revocación inmediata de sesiones portal al desactivar.

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
| **Finanzas / caja** | Módulo ventas/caja; ingresos baños (tarjeta, transferencia, efectivo); IVA declarado/no declarado; balances mensuales | Alta |
| **Notificaciones** | Push Firebase desde recordatorios (y extensión citas/portal) | Alta |
| **Historial clínico** | Notas internas solo médicos; campo `medico_atendio` obligatorio (confirmado) | Media |
| **Inventario** | Salida ligada a historial para medicamentos controlados; política mermas confirmada (bloqueo negativo, motivo, autorización supervisor) | Media |
| **Portal / auth** | Registro self-service landing; UI perfil dual post-login; revocación inmediata sesiones + `disabled` Auth al desactivar portal (confirmado) | Media |
| **Roles / plataforma** | Rol **super admin / dueño** para desarrolladores (acceso total, distinto de administrador clínico) | Media |
| **Integraciones** | WhatsApp / agendas (FB contacto); ContactosWeb automatización (saludo, seguimiento) | Baja |
| **Operación / citas** | Cascada baja lógica cliente; archivo automático recordatorios (mascota Fallecido); validación agenda por veterinario (1 vet/cita, sin solapamiento); duración default 30 min configurable | Media |
| **Plataforma** | Multi-sucursal; migración nodos legacy inventario (coordinar móvil); dashboard KPIs centralizado | Baja–media |

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

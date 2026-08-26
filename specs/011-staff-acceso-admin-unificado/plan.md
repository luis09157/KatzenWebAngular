# Plan: Acceso admin unificado (011)

**Spec:** `specs/011-staff-acceso-admin-unificado/spec.md`  
**Fecha:** 2026-08-26

---

## Contratos de Datos y UI (Obligatorio)

Ver `spec.md`. Resumen:

- Revertir restricciones `.write` por `staffRole` en nodos operativos → `auth != null && auth.token.role != 'client'`.
- Mantener admin-only en `Usuarios` / `AuthPerfiles` / `PortalProvisionLog` (write false).
- UI: `STAFF_MODULE_ACCESS` → `*` para todos los roles staff conocidos.

### Pregunta de negocio (resuelta)

| Tema | Opciones | Decisión |
|------|----------|----------|
| Write `Usuarios` / `AuthPerfiles` | (A) solo administrador · (B) todo staff | **(A)** — provision usuarios staff sigue siendo admin |

---

## Plan de Mitigación y Rollback

| Riesgo | Mitigación | Rollback |
|--------|------------|----------|
| Staff de baja confianza escribe inventario/clínico | Roles siguen existiendo; auditoría humana; callables admin | Re-desplegar rules 008 + matriz UI previa |
| Deploy rules falla sintaxis | Validar JSON + deploy; fix inmediato | `firebase deploy --only database` con commit anterior |
| Cypress falla por selectores | Selectores tolerantes + visitAdminModule | Ajustar spec Cypress |

---

## Archivos

| Archivo | Cambio |
|---------|--------|
| `src/app/core/config/staff-role.config.ts` | `*` para doctor/recepcionista/peluquero |
| `database.rules.json` | Simplificar writes operativos |
| `cypress/e2e/admin-roles-008-smoke.cy.ts` | Esperar acceso, no deny |
| `specs/008-…/smoke-roles-checklist.md` | Matriz ALLOW |
| `specs/memory/domain-context.md` | §5 matriz |
| `specs/AUDIT-CODE.md` | Nota supersede 008 |

---

## Validación

1. `npm run build`
2. `firebase deploy --only database`
3. `npm run cy:roles-008` (+ rtdb-probe si hay credenciales)
4. `npm run cy:admin` (smoke admin)
5. localhost `:4200` vivo

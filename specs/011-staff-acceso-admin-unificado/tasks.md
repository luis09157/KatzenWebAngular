# Tasks: 011-staff-acceso-admin-unificado

## Implementación

- [x] Actualizar `STAFF_MODULE_ACCESS` → `*` todos los roles staff
- [x] Simplificar `database.rules.json` writes operativos
- [x] Mantener Usuarios/AuthPerfiles admin-only
- [x] Spec + plan + tasks 011
- [x] Actualizar domain-context §5 y AUDIT-CODE
- [x] Actualizar Cypress `admin-roles-008-smoke.cy.ts`
- [x] Actualizar `smoke-roles-checklist.md`
- [x] `npm run build` exit 0
- [x] `firebase deploy --only database`
- [x] Cypress roles + cy:admin
- [x] Commit + push (sin secrets)
- [x] localhost :4200 vivo

## Testing y validación exhaustiva

| Check | Resultado | Fecha |
|-------|-----------|-------|
| Build | **PASS** exit 0 | 2026-08-26 |
| Deploy database | **PASS** rules released | 2026-08-26 |
| Cypress roles 008/011 | **16/16 PASS** | 2026-08-26 |
| Cypress cy:admin | **23/23 PASS** | 2026-08-26 |
| RTDB probe (ALLOW operativo) | **PASS** doctor/recep/peluquero todos ALLOW | 2026-08-26 |
| Preview :4200 | **PASS** (LISTEN) | 2026-08-26 |

### QA (alcance permisos)

- [x] Menú admin completo para doctor/recepcionista/peluquero
- [x] Inventario/historiales/citas visitables sin redirect a inicio
- [x] Portal client no afectado (rules de lectura propias intactas)

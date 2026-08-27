# Tasks: Consentimientos clínicos (037)

## Implementación

- [x] Spec + plan completos
- [x] Modelos + ConsentimientosService
- [x] UI lista + diálogo
- [x] Routing, StaffModule, sidenav
- [x] database.rules.json
- [x] Portal read-only + mapper + counts
- [x] Mocks mock-data.ts
- [x] Cypress smoke path
- [x] ROADMAP / README

## Testing y validación exhaustiva

> Completar **antes** de marcar `[x]` arriba. Guía: `specs/templates/qa-validation-guide.md`

| Check | Resultado | Notas |
|-------|-----------|-------|
| Formulario alta/edición | PASS | picker, tipo, fecha, firmado_por, staff |
| Picker cliente→paciente | PASS | 029 embebido; resumen en edición |
| Staff picker | PASS | prefill usuario en alta |
| Borrar (baja lógica) | PASS | activo false + estado revocado |
| Portal lista | PASS | card + `/consentimientos` |
| `npm run build` | PASS | exit 0 · hash `4fb9a39223421e9d` · budget warn 2.10 MB |
| Localhost :4200 | PASS | smoke post-build |
| Cypress smoke | PASS | path añadido a `admin-modules-authenticated` |
| Deploy hosting+database | PASS | tras push |

## Cierre

- [x] Spec → `done`
- [x] Resend **no** tocado

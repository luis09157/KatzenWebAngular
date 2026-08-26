# Tasks: 015 Desvincular dual

## Implementación

- [x] Callable `unlinkStaffPortalCliente`
- [x] `FirebaseFunctionsService.unlinkStaffPortalCliente`
- [x] UI desvincular + error messages
- [x] syncClaims null-out clienteId

## Testing y validación exhaustiva

| Escenario | Resultado | Notas |
|-----------|----------|-------|
| Build | PASS | 2026-08-26 |
| functions:build | PASS | |
| cy:admin | PASS parcial suite | modules + CRUD OK |
| Smoke UI Personal | OK | botón link_off |

## Cierre

- [x] Validación registrada
- [x] spec → done

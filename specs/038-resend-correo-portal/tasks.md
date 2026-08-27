# Tasks: 038 Resend correo portal

## Implementación

- [x] Spec + plan
- [x] Luis aporta `RESEND_API_KEY`
- [x] `firebase functions:secrets:set RESEND_API_KEY` (versión 1)
- [x] `npm run functions:build`
- [x] Deploy `provisionPortalClient`, `resendPortalClientAccess`, `registerPortalOwner` (2026-08-26)
- [x] Actualizar ROADMAP / QA-CRUD-MATRIX / AGENTS
- [ ] Smoke Luis: reenviar acceso → inbox cuenta Resend (modo prueba)

## Testing y validación exhaustiva

| Check | Resultado | Notas |
|-------|-----------|-------|
| Secret existe | PASS | Secret Manager v1 |
| functions:build | PASS | exit 0 |
| Deploy callables | PASS | 3 functions us-central1 |
| emailSent smoke | PENDIENTE Luis | modo prueba → email cuenta Resend |

## Cierre

- [x] Spec → done (código + secret + deploy)
- [x] No inventar key (Luis la aportó)
- [ ] Dominio propio = fase B (clientes reales)

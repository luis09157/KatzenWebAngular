# Tasks: 038 Resend correo portal

## Implementación

- [x] Spec + plan
- [x] Luis aporta `RESEND_API_KEY`
- [x] `firebase functions:secrets:set RESEND_API_KEY` (versión 1)
- [x] `npm run functions:build`
- [x] Deploy `provisionPortalClient`, `resendPortalClientAccess`, `registerPortalOwner` (2026-08-26)
- [x] Actualizar ROADMAP / QA-CRUD-MATRIX / AGENTS
- [x] Smoke agente: Resend directo OK; callable con `@example.com` → 422 esperado

## Testing y validación exhaustiva

| Check | Resultado | Notas |
|-------|-----------|-------|
| Secret existe | PASS | Secret Manager v1 |
| functions:build | PASS | exit 0 |
| Deploy callables | PASS | 3 functions us-central1 |
| Resend API directo | PASS | envío a Gmail admin → 200 |
| Callable reenvío | PASS* | Key OK; falla solo destino `@example.com` (modo prueba) |

## Cierre

- [x] Spec → done (código + secret + deploy)
- [x] No inventar key (Luis la aportó)
- [ ] Dominio propio = fase B (clientes reales) — guía: `FASE-B-DOMINIO.md`

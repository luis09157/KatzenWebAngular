# Tasks: 038 Resend correo portal

## Implementación

- [x] Spec + plan
- [ ] Luis aporta `RESEND_API_KEY` (bloqueante)
- [ ] `firebase functions:secrets:set RESEND_API_KEY`
- [ ] `npm run functions:build`
- [ ] Deploy `provisionPortalClient`, `resendPortalClientAccess`, `registerPortalOwner`
- [ ] Actualizar ROADMAP / QA-CRUD-MATRIX / AGENTS
- [ ] Smoke documentado

## Testing y validación exhaustiva

| Check | Resultado | Notas |
|-------|-----------|-------|
| Secret existe | PENDIENTE | 404 hasta que Luis setee |
| functions:build | | |
| Deploy callables | | |
| emailSent smoke | | modo prueba → inbox Resend |

## Cierre

- [ ] Spec → done cuando secret + deploy OK
- [ ] No inventar key

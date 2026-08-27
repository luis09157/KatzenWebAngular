# Plan: 038 Resend correo portal

1. Documentar activación (spec/tasks).
2. Esperar `RESEND_API_KEY` de Luis (no inventar).
3. `secrets:set` + `functions:build` + deploy callables portal.
4. Actualizar QA-CRUD-MATRIX / ROADMAP / AGENTS.
5. Smoke documentado (modo prueba).

## Mitigación

Deploy solo functions mail; hosting no requerido. Si falla secret, no tocar FCM codebase.

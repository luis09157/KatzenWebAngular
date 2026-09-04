# Notas operativas — Resend (correo portal)

**Estado real (2026-09-04):** Resend **activado el 2026-08-26** (esta spec 038): `RESEND_API_KEY` en Secret Manager y callables portal desplegados. **Dominio propio pendiente** (Fase B). Esta nota reemplaza la sección Resend que antes vivía en `AGENTS.md`; `ROADMAP.md` y `QA-CRUD-MATRIX.md` apuntan aquí.

## Hechos

- Callables que envían correo (codebase `default`): `provisionPortalClient`, `resendPortalClientAccess`, `registerPortalOwner`. Código en `functions/src/portal-mail.ts`; si falta la key, responden `emailSent: false` sin romper el flujo.
- FROM por defecto: `KatzenVet <onboarding@resend.dev>`; se sobreescribe con el secret opcional `PORTAL_FROM_EMAIL` cuando exista dominio verificado.
- FCM push va en el codebase separado `functions-fcm` (`onRecordatorioWritePush`) y **no** depende de Resend.

## Límites sin dominio propio

| Escenario | ¿Funciona? |
|-----------|------------|
| Hosting `katzen-a0e3e.web.app` como dominio de envío | **No** (Hosting no sirve para DNS de correo) |
| Sin dominio verificado | Solo **modo prueba**: el correo llega únicamente al email de la cuenta Resend |
| Correo a clientes reales | **Pendiente** Fase B (dominio + `PORTAL_FROM_EMAIL`) |

No marcar PASS de «correo a clientes» hasta cerrar la Fase B.

## Pendientes (Luis)

1. Smoke en modo prueba: provisionar un cliente de prueba y confirmar que el correo llega al inbox de la cuenta Resend.
2. Fase B — dominio propio: pasos en [`FASE-B-DOMINIO.md`](./FASE-B-DOMINIO.md) (DNS, verificación, `firebase functions:secrets:set PORTAL_FROM_EMAIL`, redeploy de los tres callables).

## Reglas para el agente

- **Nunca** inventar ni pegar una API key; los secrets los setea Luis (`firebase functions:secrets:set RESEND_API_KEY`).
- Redeploy de callables solo con autorización explícita de Luis (nivel L3).

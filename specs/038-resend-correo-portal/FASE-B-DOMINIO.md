# Resend — Fase B: dominio propio (correo a clientes reales)

**Estado:** pendiente DNS Luis (Fase A OK: `RESEND_API_KEY` + callables en prod)  
**El agente no inventa API keys ni ejecuta `firebase functions:secrets:set`.**

---

## Qué debe hacer Luis (3 pasos)

1. **Dominio en Resend** → [Domains](https://resend.com/domains) → Add Domain (ej. `katzenvet.com` o `mail.katzenvet.com`) → copiar SPF, DKIM y DMARC.
2. **Pegar DNS en tu registrador** y esperar a que Resend muestre **Verified** (minutos a 48 h). Sin esto, el correo **solo llega al inbox de la cuenta Resend**, no al dueño.
3. **Cuando esté Verified**, avisar (o ejecutar tú) el FROM + redeploy:
   ```bash
   firebase functions:secrets:set PORTAL_FROM_EMAIL
   # Valor: KatzenVet <portal@tudominio.com>
   npm run functions:build
   firebase deploy --only functions:provisionPortalClient,functions:resendPortalClientAccess,functions:registerPortalOwner
   ```
   Smoke: Admin → cliente con correo real → **Reenviar acceso** → el mail debe llegar **al cliente**, no solo a Resend.

No hace falta crear otra `RESEND_API_KEY` (Fase A ya está).

---

## Por qué

En **modo prueba** (`onboarding@resend.dev`) Resend solo entrega al **email de la cuenta Resend**, no al dueño. Para que llegue a `cliente@correo.com` hace falta un **dominio verificado**.

---

## Detalle de los 3 pasos

### 1. Dominio en Resend

1. [Resend → Domains](https://resend.com/domains) → **Add Domain**
2. Usar dominio que controles (ej. `katzenvet.com` o subdominio `mail.katzenvet.com`)
3. Copiar registros DNS (SPF, DKIM, opcional DMARC)

### 2. DNS en tu registrador

Añadir los registros TXT/CNAME que Resend indique. Esperar propagación (minutos–48 h) hasta estado **Verified**.

### 3. Secret FROM + redeploy + smoke

El código ya lee `process.env.PORTAL_FROM_EMAIL`; fallback: `KatzenVet <onboarding@resend.dev>`.

Tras el deploy del paso 3:

1. Admin → Cliente con correo real → **Reenviar acceso**
2. Confirmar llegada al **correo del cliente** (no solo inbox Resend)
3. Login portal con contraseña temporal

---

## Rollback

- Quitar o vaciar secret `PORTAL_FROM_EMAIL` → vuelve fallback prueba
- Redeploy callables

---

## Checklist

- [ ] Dominio añadido en Resend
- [ ] DNS verificado (Verified)
- [ ] `PORTAL_FROM_EMAIL` en Secret Manager *(Luis o agente con OK explícito; el agente no lo setea solo)*
- [ ] Redeploy callables *(solo con OK Luis)*
- [ ] Smoke correo a cliente real
- [ ] Registrar PASS en `specs/038-resend-correo-portal/tasks.md`

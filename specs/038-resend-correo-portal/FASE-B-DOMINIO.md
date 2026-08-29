# Resend — Fase B: dominio propio (correo a clientes reales)

**Estado:** pendiente DNS Luis  
**Prerequisito:** Fase A OK (`RESEND_API_KEY` + callables desplegadas — spec 038)

---

## Por qué

En **modo prueba** (`onboarding@resend.dev`) Resend solo entrega al **email de la cuenta Resend**, no al dueño. Para que llegue a `cliente@correo.com` hace falta un **dominio verificado**.

---

## Pasos (Luis)

### 1. Dominio en Resend

1. [Resend → Domains](https://resend.com/domains) → **Add Domain**
2. Usar dominio que controles (ej. `katzenvet.com` o subdominio `mail.katzenvet.com`)
3. Copiar registros DNS (SPF, DKIM, opcional DMARC)

### 2. DNS en tu registrador

Añadir los registros TXT/CNAME que Resend indique. Esperar propagación (minutos–48 h).

### 3. Secret opcional FROM

Cuando el dominio esté **Verified**:

```bash
firebase functions:secrets:set PORTAL_FROM_EMAIL
# Ejemplo valor: KatzenVet <portal@tudominio.com>
```

El código ya lee `process.env.PORTAL_FROM_EMAIL`; fallback: `KatzenVet <onboarding@resend.dev>`.

### 4. Redeploy callables portal

```bash
npm run functions:build
firebase deploy --only functions:provisionPortalClient,functions:resendPortalClientAccess,functions:registerPortalOwner
```

### 5. Smoke

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
- [ ] `PORTAL_FROM_EMAIL` en Secret Manager
- [ ] Redeploy callables
- [ ] Smoke correo a cliente real
- [ ] Registrar PASS en `specs/038-resend-correo-portal/tasks.md`

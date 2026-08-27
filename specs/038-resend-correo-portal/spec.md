# Spec: Activar Resend — correo portal

**ID:** 038-resend-correo-portal  
**Estado:** in_progress  
**Fecha:** 2026-08-26  
**Autor:** Agente Cursor / Luis Alfonso Niño Martínez  

---

## Problema

El código de correo portal ya existe (`portal-mail.ts` + callables), pero **`RESEND_API_KEY` no está en Secret Manager** (404). Sin el secret no se puede desplegar ni enviar bienvenida / reenvío / self-registro.

Luis autorizó cerrar este paso (**final del backlog**).

---

## User stories

### US-1 — Secret + deploy

Como **dueño del sistema**  
Quiero **configurar Resend y desplegar las functions de correo**  
Para **que los dueños reciban acceso al portal**

**Criterios:**

- [ ] SC-001: `RESEND_API_KEY` existe en Secret Manager (Luis aporta la key; el agente no inventa)
- [ ] SC-002: Deploy `provisionPortalClient`, `resendPortalClientAccess`, `registerPortalOwner` OK
- [ ] SC-003: Smoke: reenviar acceso → `emailSent: true` (modo prueba → email cuenta Resend)

### US-2 — Claridad operativa

Como **admin**  
Quiero **mensajes claros si el correo no sale**  
Para **saber si falta secret, dominio o fue error de Resend**

---

## Fuera de alcance

- Dominio propio DNS (opcional fase B; sin él solo llega al email de la cuenta Resend)
- CFDI / WhatsApp
- Inventar API keys

---

## Contratos de Datos y UI (Obligatorio)

- **RTDB:** sin cambios de schema. Solo Secret Manager + Functions.
- **Mocks:** N/A (integración externa).
- **UI:** mensajes existentes en Usuarios/Clientes; docs ROADMAP/QA actualizados.

---

## Plan de Mitigación y Rollback

- Si deploy falla: functions previas siguen; UI ya tolera `emailSent: false`.
- Rollback secret: no borrar sin OK Luis; se puede rotar key en Resend + `secrets:set` de nuevo.

---

## Pasos Luis (bloqueante)

1. Cuenta en https://resend.com → **API Keys** → Create  
2. Pegar la key al agente **o** ejecutar:
   ```bash
   firebase functions:secrets:set RESEND_API_KEY
   ```
3. (Opcional) Dominio verificado + `PORTAL_FROM_EMAIL`

## Pasos agente (tras key)

```bash
npm run functions:build
firebase deploy --only functions:provisionPortalClient,functions:resendPortalClientAccess,functions:registerPortalOwner
```

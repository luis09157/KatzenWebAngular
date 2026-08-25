# Plan técnico: Portal clientes en Usuarios

**Spec:** `specs/002-portal-clientes-usuarios/spec.md`  
**Estado:** done  

---

## Archivos implementados

### Functions

- `functions/src/portal-mail.ts` — `generateSecurePassword`, `sendPortalWelcomeEmail` (Resend)
- `functions/src/index.ts` — 4 callables portal + `mustChangePassword` en claims

### Angular admin

- `src/app/usuarios/portal-clientes.service.ts`
- `src/app/usuarios/provision-portal-cliente-dialog.component.*`
- `src/app/usuarios/usuarios.component.*` — 4 tabs
- `src/app/clientes/clientes-dialog.module.ts` — diálogo reutilizable

### Portal

- `src/app/portal/perfil/*` — cambio contraseña
- `src/app/portal/guards/portal-auth.guard.ts`
- `src/app/core/services/auth-profile.service.ts`

### Reglas

- `database.rules.json` — `PortalProvisionLog`

---

## Deploy

```bash
firebase deploy --only functions:provisionPortalClient,functions:deactivatePortalClient,functions:resendPortalClientAccess,functions:clearMustChangePassword
firebase functions:secrets:set RESEND_API_KEY   # producción correo
```

---

## Clasificación clientes

```
conPortal:    authUid + portalActivo
pendientes:   correo válido + sin portal activo
sinCorreo:    sin correo válido + sin portal activo
```

Correo inválido: vacío, n/p, "no proporcionado", "sin correo", etc.

---

## Nota histórica

Esta spec se cerró (`done`) antes de que existieran las secciones **Contratos de Datos y UI** y **Plan de Mitigación y Rollback** en la plantilla SDD v2. El plan original no las incluía; se añadieron después en `specs/templates/module-plan.template.md` como requisito obligatorio para specs nuevas.

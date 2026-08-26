# Plan técnico: Registro portal cliente (admin + landing)

**Spec:** `specs/013-registro-portal-cliente-landing/spec.md`  
**Estado:** approved  

---

## Resumen

Reutilizar `provisionPortalClient` + `portal-mail` para auto-activar portal al alta admin. Añadir callable pública `registerPortalOwner` (Admin SDK) que crea Cliente + Auth + claims + correo, con rate-limit en RTDB y fallo temprano si falta `RESEND_API_KEY`. Landing: formulario de registro en sección portal / modal. Sin escritura anónima abierta a `Cliente`.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/clientes/clientes.component.ts` | modificar | post-save provision + loading |
| `src/app/core/services/firebase-functions.service.ts` | modificar | `registerPortalOwner` |
| `src/app/core/error-messages.service.ts` | modificar | contexto registro portal |
| `src/app/landing/landing.component.ts/html/css` | modificar | form registro |
| `src/app/landing/landing.module.ts` | verificar | MatCheckbox ya importado |
| `cypress/e2e/admin-smoke.cy.ts` | modificar | smoke registro landing visible |

### Firebase

| Archivo | Acción |
|---------|--------|
| `functions/src/index.ts` | callable `registerPortalOwner` |
| `functions/src/portal-mail.ts` | opcional copy self-reg; check key helper |
| `database.rules.json` | `PortalRegistroRate` read/write false |

### Specs / docs

| Archivo | Acción |
|---------|--------|
| `specs/README.md`, `domain-context.md`, `ROADMAP.md`, `AUDIT-CODE.md` | indexar 013 |

---

## Modelo de datos

```text
Katzen/Cliente/{uuid}          # igual que alta admin; portal* opcionales
Katzen/AuthPerfiles/{uid}      # role: client, mustChangePassword: true
Katzen/PortalProvisionLog/{id} # action: 'self_register' | 'provision'
Katzen/PortalRegistroRate/{key}
  count: number
  windowStart: ISO
  # key = sha256(ip|email) truncado — solo Admin SDK
```

---

## Flujos

### Flujo admin (nuevo cliente)

1. Staff guarda Cliente nuevo en diálogo.
2. `guardarCliente` → id.
3. Si correo válido → `provisionPortalClient(id)`.
4. Swal éxito / warning email / error provision (cliente ya creado).

### Flujo landing

1. Usuario completa form + acepta privacidad.
2. `registerPortalOwner({ nombre, correo, telefono?, acceptPrivacy })`.
3. CF valida, rate-limit, exige Resend, crea Cliente+Auth+perfil, envía mail.
4. UI: «Revisa tu correo» → link a `/portal/login`.

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Sin privacidad | invalid-argument |
| Correo en Auth | already-exists |
| Rate limit | resource-exhausted |
| Sin Resend (self) | failed-precondition — configurar correo |
| Staff no-admin provision | permission-denied — cliente guardado |

---

## Servicios

- `FirebaseFunctionsService.registerPortalOwner()`
- `FirebaseFunctionsService.provisionPortalClient()` (existente)
- `ContactoWebService` no se usa para registro (solo contacto)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** aditivo; sin renombrar nodos.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Cliente` portal* | write Functions | no | opcionales |
  | `Katzen/PortalRegistroRate` | nuevo | no | solo Functions |
  | `AuthPerfiles` | igual patrón portal | no | |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** mocks / localhost UI; functions:build local; smoke deploy solo con auth Luis.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia |
  |--------|------------|
  | Loading | `LoadingService` + `LOADING_MESSAGES.saving` |
  | Errores | `ErrorMessagesService` |
  | Modal landing | `.portal-modal*` existente |
  | Copy Borrar | clientes ya usa «Borrar» |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos en contratos.
- [ ] Compilación local `npm run build` + `functions:build`.
- [x] Rollback documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Falla CF tras createUser | `deleteUser` + borrar Cliente creado |
| `registerPortalOwner` mala | redeploy versión anterior / deshabilitar invoker |
| UI rompe build | revertir commit feature |
| Rate node rules | revert `database.rules.json` |

---

## Deploy

```bash
npm run build
npm run functions:build
firebase deploy --only functions:registerPortalOwner,functions:provisionPortalClient,functions:resendPortalClientAccess
firebase deploy --only database   # si rules PortalRegistroRate
firebase deploy --only hosting    # UI landing + admin
```

### Correo Resend (operativo)

1. Sin dominio propio: FROM default `KatzenVet <onboarding@resend.dev>` → **solo** email de la cuenta Resend.
2. `firebase functions:secrets:set RESEND_API_KEY` (Luis pega la key; no inventar).
3. Redeploy de las tres functions de arriba (código ya usa `defineSecret`).
4. Dominio futuro: verificar DNS en Resend → `PORTAL_FROM_EMAIL` → redeploy.
5. Detalle: `specs/QA-CRUD-MATRIX.md`.

---

## Riesgos

- `RESEND_API_KEY` no configurada en prod → self-reg bloqueado hasta configurar.
- `provisionPortalClient` solo admin → staff no-admin no auto-activa (aceptable).
- Abuso self-reg → rate limit IP/email.

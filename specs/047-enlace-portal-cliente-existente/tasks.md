# Tasks: 047 Enlace portal ↔ cliente clínico

**Estado:** done (olas 1–3 código; deploy ola 3 pendiente OK Luis)  
**Spec:** `spec.md`

## Ola 1 — Ficha cliente

- [x] T-010: Bloque «Acceso al portal» en detalle (`modoVer`)
- [x] T-011: Botón enviar acceso → `provisionPortalClient`
- [x] T-012: Botón reenviar → `resendPortalClientAccess`
- [x] T-013: Estados sin correo / activo / inactivo
- [x] T-014: Chip Portal en listado

## Ola 2 — Self-reg vínculo correo

- [x] T-020: Match correo en `registerPortalOwner` antes de crear Cliente
- [x] T-021: Copy éxito landing si vinculado
- [x] T-022: Deploy functions + hosting (`registerPortalOwner`, copy landing)

## Ola 3 — Teléfono + confirmación

- [x] T-030: Confirmación match teléfono / mascota (no auto-vínculo). Código 2026-08-28. Deploy `registerPortalOwner` **solo con OK Luis**.

## Testing y validación exhaustiva

> Ola 1–2 · cierre 2026-08-28  
> Ola 3 · 2026-08-28 (agente QA; sin producción)

| Ítem | Resultado | Notas |
|------|-----------|-------|
| `npm run build` | **PASS** | exit 0 (warning budget bundle inicial, preexistente) |
| `npm run functions:build` | **PASS** | functions + functions-fcm |
| `npm --prefix functions test` | **PASS** | 14/14 `portal-phone-match.util` |
| Detalle portal (enviar/reenviar) | **PASS** | código + prod (ola 1–2) |
| Self-reg match correo | **PASS** | umbral alto: auto-vínculo (ola 2, prod previo) |
| Landing Swal vinculado correo | **PASS** | hosting prod ola 2 |
| Password no en response | **PASS** | preview ola 3 no crea Auth |
| Teléfono normalizado MX 10 / +52 | **PASS** | unit tests |
| Match único → `needsConfirmation` (no Auth) | **PASS** | unit `resolvePhoneMatch` + código callable |
| Varios teléfonos → pide mascota | **PASS** | unit + Swal landing |
| Mascota desambigua / ambigua / no coincide | **PASS** | unit |
| Rechazo → ficha nueva (`skipPhoneMatch`) | **PASS** | código landing + callable |
| Confirmación revalida teléfono | **PASS** | `loadClienteLinkableById` + `normalizeMxPhone` |
| Copy landing `matchKind === 'phone'` | **PASS** | modal + Swal (código; compile OK) |
| Campo mascota + hint no auto-vínculo | **PASS** | HTML landing; `localhost:4200` HTTP 200 |
| RTDB aditivo `telefonoNorm` / `portalLinkedFrom` | **PASS** | opcional; móvil ignora |
| Live preview :4200 | **PASS** | `ng serve` Compiled successfully; HTTP 200 |
| Deploy ola 3 | **NO** | Luis no autorizó; no `firebase deploy` |
| Secrets Resend | **N/A** | no `secrets:set`; Fase B documentada |

### Checklist pre-entrega (ola 3)

- [x] Guía QA `specs/templates/qa-validation-guide.md` aplicada (§1–§4, lo aplicable)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo
- [x] Tabla de resultados rellenada **antes** de marcar T-030
- [x] UI landing: modal registro centrado, hint visible, loading contextual al confirmar

### 1. Formularios y validaciones

- [x] Campos vacíos: registro sigue exigiendo nombre, correo, privacidad; mascota opcional
- [x] Teléfono inválido: pattern landing + `normalizeMxPhone` rechaza basura
- [x] Mascota maxlength 80
- [x] Chips/badges: N/A ola 3 (no tabla admin)

### 2. Interfaz y modales

- [x] Modal registro abre/cierra; extra field no rompe `portal-modal--register`
- [x] Swal confirmación: Sí / No crear ficha / Cancelar
- [x] Loading: «Buscando tu ficha…» / «Vinculando tu expediente…» / hide en finally
- [x] Doble submit: `isRegistering` bloquea

### 3. Casos límite

- [x] Correo match gana sobre teléfono (no se evalúa phone si hay email linkable)
- [x] Teléfono compartido sin mascota → no lista padrón (`needsPetName`)
- [x] Ficha con portal ya activo excluida
- [x] Rate-limit existente se mantiene en preview y confirm

### 4. Integridad

- [x] Build + functions build
- [x] Unit match teléfono
- [x] Cómo probar E2E: emulador Functions (abajo); **no prod**

## Cómo probar ola 3 (emulador / mocks — no producción)

1. `firebase emulators:start --only functions,database,auth` (con `RESEND_API_KEY` de emulador o skip mail según entorno local de Luis).
2. Seed `Katzen/Cliente` con `telefono: "8136024090"`, `activo: true`, sin `portalActivo`/`authUid`; mascota `Luna` con `idCliente` de esa ficha.
3. Landing `http://localhost:4200` → Crear cuenta → mismo teléfono + **otro** correo que no exista en Auth.
4. Debe aparecer Swal «¿Te encontramos…?» con Luna — **no** crear cuenta todavía.
5. «Sí, soy yo» → vincula esa ficha; «No, crear ficha nueva» → Cliente nuevo.
6. Match **correo** igual al de la ficha: auto-vínculo (ola 2), sin Swal de teléfono.

## Resend (Luis)

Ver `specs/038-resend-correo-portal/FASE-B-DOMINIO.md` — 3 pasos: dominio → DNS Verified → FROM + redeploy (con OK). El agente **no** setea secrets ni deploya.

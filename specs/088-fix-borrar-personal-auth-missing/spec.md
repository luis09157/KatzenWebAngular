# Spec: Fix borrar personal cuando no hay cuenta Auth

**ID:** 088-fix-borrar-personal-auth-missing  
**Estado:** done  
**Fecha:** 2026-10-02  
**Autor:** Cursor / Luis Alfonso Niño Martínez  
**Nivel:** L3 (Cloud Function `updateStaffUser`)  

---

## Problema

Al borrar personal en `/admin/usuarios` (p. ej. «sthefany @katzen»), la UI muestra *«El servidor no pudo procesar la solicitud»* (`functions/internal`).

Causa: `updateStaffUser` escribe `activo: false` en RTDB y luego llama `admin.auth().updateUser(uid, { disabled: true })` / `setCustomUserClaims`. Si el UID **no existe en Firebase Auth** (registro legacy solo en `Katzen/Usuarios`), Auth lanza `auth/user-not-found` → error interno. El cliente cree que falló, aunque a veces **sí** quedó borrado en RTDB.

Además, al editar sin enviar `activo`, el código forzaba `AuthPerfiles.activo = true` (riesgo de reactivar).

---

## User stories

### US-1 — Borrar personal sin cuenta Auth

Como **administrador**  
Quiero **borrar personal aunque no tenga cuenta Auth**  
Para **que desaparezca del listado sin error falso**

**Criterios de aceptación:**

- [x] SC-001: Si Auth responde `user-not-found`, la callable **no** falla: RTDB + AuthPerfiles quedan inactivos y responde `success: true` con mensaje claro.
- [x] SC-002: Si Auth existe, se deshabilita, se revocan refresh tokens (best-effort) y se sincronizan claims.
- [x] SC-003: Editar sin `activo` **no** fuerza `AuthPerfiles.activo = true`.
- [x] SC-004: Tras error en UI, se refresca el listado (por si RTDB ya cambió). Deploy de `updateStaffUser` documentado (autoriza Luis).

---

## Fuera de alcance

- Borrado físico de Auth / RTDB
- Migración masiva de UIDs legacy
- Deploy sin autorización de Luis

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Aditivo / soft-delete existente (`activo: false`). Puede crear `AuthPerfiles/{uid}` mínimo si no existía.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Usuarios/{uid}` | admin fn | `activo`, `staffRole`, audit | baja lógica |
  | `Katzen/AuthPerfiles/{uid}` | admin fn | `activo`, `staffRole` o set mínimo | sin Auth también |
  | Firebase Auth | admin SDK | `disabled` / claims | tolerar `user-not-found` |

- **Estrategia de Datos de Prueba:** Emulador o staging; **no** escribir prod desde el agente. Caso: UID en Usuarios sin Auth → borrar → success.
- **Patrones UI:** Swal existente en `usuarios.component`; copy «Borrar».

---

## Plan de Mitigación y Rollback

- **Mitigación:** Mismo patrón que `deactivatePortalClient` (catch `auth/user-not-found`).
- **Rollback:** Redeploy de la versión anterior de `updateStaffUser` (git). Soft-deletes en RTDB no se revierten solos.
- **Deploy (Luis):** `firebase deploy --only functions:updateStaffUser` (+ hosting si se quiere el refresh de lista en el catch).

---

## Testing mínimo

- `npm run functions:build`
- `npm run build` (UI)
- Smoke: borrar staff sin Auth en emulador / tras deploy autorizado

---

## Notas

- Sthefany pudo quedar ya con `activo: false` en prod pese al error; al refrescar el listado no debería verse. Si sigue visible, reintentar tras el deploy de la function.

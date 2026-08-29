# Spec: Auto-redirect de login staff con sesión activa

**ID:** 051-login-auto-redirect  
**Estado:** done  
**Fecha:** 2026-08-28  
**Autor:** agente (reporte Luis Alfonso Niño Martínez)

---

## Problema

Con sesión Firebase activa, visitar `/admin/login` o `/login` sigue mostrando el formulario en producción. Los fixes `ad7d547` y `a2f810d` no resolvieron el síntoma: el primero solo cubría sesión recordada en `localStorage`; el segundo espera `authState` solo si hay marcador `sessionStorage` y, si no hay marcador, puede **cerrar** la sesión Firebase (`bootstrapIfMissing: false`).

Causa raíz (código, no el parche anterior):

1. `AngularFireAuth.currentUser` (proxy lazy) es `null` hasta que Auth termina de hidratar persistencia.
2. `authState` de AngularFire compat **no emite** hasta `getRedirectResult()` (`switchMapTo`). Un `take(1)` / timeout trata el `null` inicial o el silencio como “sin sesión”.
3. `getActiveAuthUser` path 3 (1.5 s + `signOutOnly` sin marcador Katzen) destruye una sesión LOCAL válida.
4. No hay GuestGuard: cualquier fallo pinta el formulario.
5. Dual auto-enter iba a `/auth/contexto` (misma card de auth), no a `/admin/inicio`.

---

## User stories

### US-1 — Staff con sesión vuelve al panel

Como **personal staff**  
Quiero **que `/admin/login` y `/login` me lleven a `/admin/inicio` si ya hay sesión**  
Para **no volver a escribir correo y contraseña**

**Criterios de aceptación:**

- [x] SC-001: Sesión staff (remember me LOCAL, sin key `sessionStorage`) → `/admin/inicio`, no formulario
- [x] SC-002: `authState` emite `null` y después el user → se espera el user (no `take(1)` del null)
- [x] SC-003: Sin sesión → se muestra el formulario
- [x] SC-004: Dual con sesión staff desde `/admin/login` → `/admin/inicio` (staffIntent), no pedir login ni quedarse en contexto

---

## Fuera de alcance

- Cambiar persistencia Firebase ni TTL de 7 días en AuthGuard
- Login portal (`/portal/login`) más allá de no romper `getActiveAuthUser`
- Deploy de Cloud Functions

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno. Solo Auth client-side y routing. App móvil no afectada.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | — | — | sin cambios RTDB |

- **Estrategia de Datos de Prueba:** Karma con `BehaviorSubject` de `authState` (null→user). Sin RTDB producción (`katzen-a0e3e`).
- **Patrones UI Reutilizados:** `.admin-auth-page` / spinner `checkingSession` existente. Sin formularios nuevos.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (auto-entrada admin) |
| doctor | sí |
| recepcionista | sí |
| peluquero | sí |
| dual | sí → `/admin/inicio` desde login staff |
| portal client | no admin; portalLock → portal |

---

## UI (rutas y layout)

- `/login` → redirect absoluto `/admin/login`
- `/admin/login` y `/auth` (path vacío): GuestGuard + AuthComponent
- `/auth/contexto`: sin GuestGuard (flujo post-login fresco)

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Plan de Mitigación y Rollback

Si el auto-redirect falla o un guest queda en spinner: revertir commit de `051` (AuthService + GuestGuard + routing) y redeploy hosting. No hay datos RTDB que revertir. El login manual sigue siendo el fallback del formulario.

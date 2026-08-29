# Plan técnico: Auto-redirect login staff

**Spec:** `specs/051-login-auto-redirect/spec.md`  
**Estado:** approved  

---

## Resumen

Dejar de usar `currentUser` / `authState.take(1)` como verdad en el arranque. Esperar a que Firebase Auth asiente (`authStateReady` o primer user, nunca el null inicial). GuestGuard en rutas de login staff. No cerrar sesión si hay user Firebase sin marcador Katzen.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/auth/auth.service.ts` | modificar | waitForAuthUser + getActiveAuthUser |
| `src/app/auth/staff-login-guest.guard.ts` | crear | staff → `/admin/inicio` |
| `src/app/auth/staff-login-guest.guard.spec.ts` | crear | dual / guest |
| `src/app/auth/auth.component.ts` | modificar | auto-enter → inicio; catch |
| `src/app/auth/auth-routing.module.ts` | modificar | GuestGuard en path vacío |
| `src/app/app-routing.module.ts` | modificar | redirect absoluto `/login` |
| `src/app/app.component.ts` | modificar | no ensureActiveSession al boot |
| `src/app/auth/auth.guard.ts` | modificar | isAuthenticatedOnce espera auth |
| `src/app/auth/contexto-selector.component.ts` | modificar | waitForAuthUser |
| `src/app/auth/auth.service.spec.ts` | modificar | race null→user, LOCAL sin tab key |
| `src/app/auth/auth.component.spec.ts` | modificar | dual auto-enter → inicio |
| `firebase.json` | modificar | Cache-Control index.html |

### Firebase

Sin cambios RTDB/functions.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno.
- **Estrategia de Datos de Prueba:** Karma mocks; no producción.
- **Patrones UI:** spinner `checkingSession` existente.

---

## Plan de Mitigación y Rollback

Revertir el commit de hosting 051. Login manual intacto. Sin migraciones.

---

## Flujos

1. `/admin/login` + user staff asentado → GuestGuard → `/admin/inicio`
2. `authState` null luego user (LOCAL, sin sessionStorage) → user, no signOut
3. Sin user tras settle → formulario
4. Dual desde `/admin/login` con sesión → `/admin/inicio` + staffIntent
5. Login fresco dual (submit) → `/auth/contexto` (sin cambio)

---

## Testing

- Karma: race null→user; LOCAL sin tab key; dual → inicio; guest → form
- `npm run build`
- Smoke localhost `/admin/login`

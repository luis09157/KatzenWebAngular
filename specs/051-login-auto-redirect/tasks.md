# Tasks: Auto-redirect login staff

**Spec:** `specs/051-login-auto-redirect/spec.md`  
**Plan:** `specs/051-login-auto-redirect/plan.md`  

---

## Implementación

### Frontend

- [x] `waitForAuthUser` no toma el null inicial; relee `currentUser` tras settle
- [x] `getActiveAuthUser` no exige marcador sessionStorage ni hace signOut por bootstrap faltante
- [x] `StaffLoginGuestGuard` en `/admin/login` y `/auth` (path vacío)
- [x] Dual auto-enter → `/admin/inicio`
- [x] `/login` redirect absoluto
- [x] Tests Karma del race real

### Integración

- [x] Cache-Control `index.html` en Hosting
- [x] Commit + push + `firebase deploy --only hosting` — `98ab459` → https://katzen-a0e3e.web.app

---

## Testing y validación exhaustiva

> **Guía:** `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke visual
- [x] Tabla de resultados rellenada (abajo)

### 1. Formularios y validaciones de entrada

- [x] Campos vacíos del login (sin sesión): envío bloqueado — sin cambio de formulario; guest test PASS
- [x] N/A tipos numéricos / chips tabla

### 2. Interfaz, ventanas y modales

- [x] Spinner `checkingSession` mientras asienta Auth — test componente PASS
- [x] Formulario solo si no hay sesión — guest tests PASS
- [x] Shell auth centrado (sin cambio de layout)

### 3. Edge cases

- [x] authState null → user — Karma PASS
- [x] persistencia LOCAL sin key sessionStorage — Karma PASS (no signOut)
- [x] Dual desde `/admin/login` → inicio — componente + GuestGuard PASS
- [x] Sin sesión → form — PASS
- [x] portalLock no manda a admin — test componente existente PASS

### 4. Build y runtime

- [x] `npm run build` exit 0 (Hash `aa43acfa05c921a1`; warning budget bundle, preexistente)
- [x] Tests auth PASS (16/16)
- [x] `npm start` vivo — `http://localhost:4200/admin/login` HTTP 200

### Tabla de resultados

| Área | Resultado | Notas |
|------|-----------|-------|
| Race null→user | OK | `auth.service.spec` no toma null inicial |
| LOCAL sin tab key | OK | no `signOut`; bootstrap sesión Katzen |
| Dual → inicio | OK | GuestGuard + AuthComponent |
| Guest form | OK | `authStateReady` vacío → null |
| build | OK | exit 0 |
| localhost:4200 | OK | ng serve compiled; `/admin/login` 200 |

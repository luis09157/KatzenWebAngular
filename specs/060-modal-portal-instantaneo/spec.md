# Spec: Modal portal instantáneo en landing

**ID:** 060-modal-portal-instantaneo  
**Estado:** in_progress  
**Fecha:** 2026-08-31  
**Autor:** agente (reporte Luis Alfonso Niño Martínez)

---

## Problema

En producción (`https://katzen-a0e3e.web.app`), al hacer clic en **«Portal clientes»** el overlay «Portal de clientes» tarda **4–5 segundos** en aparecer. El formulario ya existe y el diseño es correcto; el dolor es la **latencia de apertura**.

Causa raíz (código, no lazy-load del diálogo): `openPortalLogin()` es `async` y **espera** `portalAuth.enterIfRememberedSession()` **antes** de poner `showPortalLoginModal = true`. Esa llamada encadena `getActiveAuthUser()` → `waitForAuthUser(timeoutMs = 4000)`. Si Firebase Auth no tiene `currentUser` inmediato, el usuario espera hasta `authStateReady` o el timeout de **4 s** con la landing congelada (sin overlay). El chunk del modal ya vive en el template de la landing (eager); no hay `MatDialog.open` ni `import()` en el click.

Debe aparecer **casi al instante** tras el click (objetivo percibido &lt; 200–300 ms en local; en prod el click no debe esperar red ni Auth).

---

## User stories

### US-1 — Apertura inmediata del overlay

Como **visitante o dueño en la landing**  
Quiero **que el modal «Portal de clientes» se pinte al instante al clic**  
Para **no esperar 4–5 segundos pensando que el botón no responde**

**Criterios de aceptación:**

- [x] SC-001: Clic en «Portal Clientes» (navbar, menú móvil, CTA hero/portal) abre el overlay **sin esperar** Firebase Auth, `syncMyClaims` ni red.
- [x] SC-002: El shell del modal (título, campos correo/contraseña, checkbox, «Entrar al portal», enlaces) es visible en el siguiente ciclo de render; no hay `await` previo a `showPortalLoginModal = true`.
- [ ] SC-003: Si hay sesión portal recordada, la auto-entrada sigue ocurriendo **en segundo plano** (el overlay puede mostrarse un instante y luego navegar a `/portal/mascotas`). Código listo; falta smoke con sesión.
- [x] SC-004: Sin sesión, el formulario es usable de inmediato (escribir correo/contraseña no espera Auth).
- [x] SC-005: Acceso staff en landing sigue siendo `routerLink` a `/admin/login` (sin MatDialog lazy en el click). No se cambia el flujo staff.

---

## Fuera de alcance

- Refactors de Auth, persistencia Firebase o `waitForAuthUser`.
- Cambiar copy del formulario (salvo que sea inevitable).
- Login en `/portal/login` (pantalla completa) más allá de no romper auto-entrada.
- Service worker / PWA precache (considerar solo si el chunk se descargara en el click; no aplica: modal eager).
- Deploy a producción / RTDB / credenciales.
- `git commit` / `git push`.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno. Solo orden de pintado del overlay en la landing. App móvil no afectada.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | — | — | sin cambios RTDB |

- **Estrategia de Datos de Prueba:** Smoke en localhost (`http://localhost:4200`) sin sesión. No conectar a RTDB de producción (`katzen-a0e3e`). Auto-entrada con sesión se verifica por código (no se adelanta Auth en el click).

- **Patrones UI Reutilizados:** Overlay existente de landing (`.portal-modal-backdrop` / `.portal-modal`), no `mat-dialog-title`. Shells portal centrados. Sin MatDialog admin.

---

## Roles

| Rol | ¿Afectado? |
|-----|------------|
| visitante (sin sesión) | sí — overlay inmediato |
| cliente portal (con/sin remember) | sí — overlay inmediato; auto-entrada en background |
| staff | no (enlace `/admin/login`) |

---

## UI (rutas y layout)

- Ruta: `/` (landing)
- Overlay inline en `landing.component.html` (`*ngIf="showPortalLoginModal"`)
- No `ADMIN_DIALOG_*`; no `mat-dialog-title`

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md` sección Testing. Criterio de este ticket: **apertura instantánea del modal**, no el login.

---

## Notas / decisiones

- Hipótesis inicial (lazy chunk / SW) **descartada**: el modal está en el bundle de landing; animación CSS ~280–380 ms.
- Staff no usa el mismo patrón (no hay MatDialog lazy en landing).
- Spec puede quedar `in_progress` si no hay sesión portal para probar auto-entrada; SC-001/002/004 cierran el dolor de producción.

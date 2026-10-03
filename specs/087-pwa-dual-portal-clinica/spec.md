# Spec: PWA dual — portal dueños vs app clínica (staff)

**ID:** 087-pwa-dual-portal-clinica  
**Estado:** done  
**Fecha:** 2026-10-02  
**Autor:** Cursor / Luis Alfonso Niño Martínez  
**Nivel:** L2  

---

## Problema

La PWA actual (`manifest.webmanifest`) se llama «KatzenVet Portal» y abre en `/portal/mascotas`. Quien instala desde landing, portal o el navegador obtiene **solo** la app de dueños. El personal (doctoras, recepción) que entra por `/admin/login` no tiene un instalador propio: al usar la app descargada “batallan” porque no llegan al panel admin sin escribir la URL.

Hace falta **dos identidades de instalación** en el mismo hosting: una para clientes y otra para la clínica, sin promocionar el admin a dueños.

---

## User stories

### US-1 — App clínica instalable desde login staff

Como **staff**  
Quiero **instalar «KatzenVet Clínica» desde `/admin/login`**  
Para **abrir siempre el panel (login/admin) con un ícono, sin teclear la URL**

**Criterios de aceptación:**

- [x] SC-001: Existe `manifest-admin.webmanifest` con `id` `/admin`, `name` «KatzenVet Clínica», `scope` `/admin/`, `start_url` `/admin/login`.
- [x] SC-002: En rutas `/admin/*` y `/auth/*` el `<link rel="manifest">` apunta al manifest de clínica.
- [x] SC-003: En `/admin/login` hay CTA «Instalar app de la clínica» (Android `beforeinstallprompt`) y hint iOS (Compartir → Inicio) si aplica.
- [x] SC-004: Tras instalar, el ícono abre en flujo staff (`/admin/login` → auto a inicio si hay sesión).

### US-2 — Portal dueños sigue siendo su propia app

Como **dueño**  
Quiero **seguir instalando solo el portal**  
Para **no ver ni instalar por error el panel de la clínica**

**Criterios de aceptación:**

- [x] SC-005: `manifest.webmanifest` queda con `id` `/portal`, `scope` `/portal/`, `start_url` `/portal/mascotas`.
- [x] SC-006: En `/portal/*` el manifest activo es el de portal; el botón de perfil sigue instalando portal.
- [x] SC-007: Landing no ofrece el instalador de clínica (manifest portal con scope fuera de `/`).

### US-3 — Documentación / memoria

Como **agente**  
Quiero **la decisión en specs y guardrails**  
Para **no volver a un solo manifest con scope `/`**

**Criterios de aceptación:**

- [x] SC-008: Spec 087 + `agent-guardrails` + `module-map` + INDEX.

---

## Fuera de alcance

- Subdominios separados (`admin.` / `portal.`)
- Cambiar rutas de `/auth/contexto` (dual puede salir brevemente del scope `/admin/`; aceptable)
- Push FCM nuevo / cambio de SW de mensajería (solo precache de ambos manifests)
- `git commit` / `firebase deploy` sin autorización de Luis
- QR impreso (operativo; se puede generar con la URL `/admin/login`)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | no | no | sin cambios |

- **Estrategia de Datos de Prueba:** Smoke localhost en `/admin/login` y `/portal/perfil`. Sin producción.

- **Patrones UI Reutilizados:** Shell `.admin-auth-page` / `.admin-auth-card`; botón outline como portal; `PwaInstallService` compartido.

---

## Roles

| Rol | ¿Accede al instalador clínica? |
|-----|--------------------------------|
| administrador / doctor / recepcionista | sí (en `/admin/login`) |
| cliente portal | no (solo portal) |

---

## UI (rutas y layout)

- `/admin/login` — CTA instalar clínica + hint iOS
- `/portal/perfil` — CTA instalar portal (existente)
- Manifest swap central en `AppComponent` / `PwaManifestService`

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md`. Unit tests del util `resolvePwaManifestKind` + build.

---

## Notas / decisiones

- Dos PWAs en el mismo origen vía `id` + scopes disjuntos (`/portal/` vs `/admin/`).
- No poner shortcut «Personal» dentro de la PWA de dueños.
- Primera instalación staff: QR o link a `/admin/login` → «Instalar app de la clínica».

---

## Código tocado / utils reutilizados / no duplicar (078)

- **Reutilizar:** `PortalPwaService` API en portal; SW FCM existente.
- **Nuevo:** `pwa-manifest.util.ts`, `PwaManifestService`, `PwaInstallService`, `manifest-admin.webmanifest`.
- **Memoria al cerrar:** [x] module-map [x] guardrails [x] INDEX

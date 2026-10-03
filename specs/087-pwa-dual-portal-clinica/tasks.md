# Tasks: PWA dual portal / clínica

**Spec:** `specs/087-pwa-dual-portal-clinica/spec.md`  
**Nivel de cambio:** L2  

---

## Implementación

### Setup

- [x] Carpeta spec 087
- [x] Anti-duplicación: no segundo SW Angular; reutilizar FCM SW + patrón PortalPwa

### Frontend

- [x] `manifest.webmanifest` scope `/portal/`
- [x] `manifest-admin.webmanifest` scope `/admin/`
- [x] `PwaManifestService` + util `resolvePwaManifestKind`
- [x] `PwaInstallService` compartido; `PortalPwaService` delega
- [x] CTA + hint iOS en `AuthComponent` (`/admin/login`)
- [x] SW precache ambos manifests (cache v5)
- [x] `angular.json` asset admin manifest

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Manifests | `src/manifest.webmanifest`, `src/manifest-admin.webmanifest` |
| Util | `src/app/core/utils/pwa-manifest.util.ts` (+ spec) |
| Servicios | `pwa-manifest.service.ts`, `pwa-install.service.ts`; portal delega |
| UI staff | `auth.component.*` |
| SW | `firebase-messaging-sw.js` (precache) |
| Boot | `app.component.ts` inicia manifest + install |

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | OK | 2026-10-02; budget warning conocido |
| Unit tests util + auth | OK | 8 SUCCESS (pwa-manifest + auth.component) |
| Smoke 375 / 1280 | localhost | CTA/hint en `/admin/login`; install real = Chrome/Android o iOS Compartir |
| RTDB aditiva | N/A | |

```
npx ng test --include='src/app/core/utils/pwa-manifest.util.spec.ts' --include='src/app/auth/auth.component.spec.ts' --browsers=ChromeHeadless --watch=false
→ 8 SUCCESS
npm run build → exit 0
```

---

## Memoria actualizada

- [x] `module-map.md`
- [x] `agent-guardrails.md`
- [x] `node scripts/specs-index.mjs`
- [x] Nota follow-up en spec **052** SC-022

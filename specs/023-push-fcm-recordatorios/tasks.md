# Tasks: Push FCM recordatorios

**Spec:** `specs/023-push-fcm-recordatorios/spec.md`

## Implementación

- [x] Spec + plan + contratos
- [x] `functions/src/recordatorio-push.ts` + export
- [x] Rules `Katzen/FcmTokens`
- [x] Docs config Messaging / tokens

## Testing

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| `npm run functions:build` | OK | 2026-08-26 |
| Sin tokens → skip | OK diseño | pushStatus skipped |
| Angular build no Messaging | OK | MVP functions-only |
| Deploy function | **OK** | codebase `fcm` — sin RESEND; 2026-08-26 |

## Criterios

- [x] SC-001…008 (código)

## Testing y validación exhaustiva (2026-08-26)

| Verificación | Resultado |
|--------------|-----------|
| `npm run functions:build` | OK (default + fcm) |
| `npm run build` | OK exit 0 · hash 093c31a |
| Deploy `functions:fcm:onRecordatorioWritePush` | OK sin RESEND |
| Deploy hosting | OK https://katzen-a0e3e.web.app |
| localhost :4200 | OK ng serve reiniciado |
| Cypress sidenav inventario | ver tasks 027 |


- [x] `PortalFcmService` + botón en `/portal/perfil`
- [x] `firebase-messaging-sw.js` en assets
- [x] `environment.fcmVapidKey` configurado (dev + prod) — 2026-08-26
- [x] Deploy `onRecordatorioWritePush` — codebase `fcm` (sin Resend) — 2026-08-26 OK
- [ ] Smoke E2E push real — requiere permiso navegador + token en RTDB

### VAPID (completado 2026-08-26)

1. [x] Firebase Console → Web Push certificates → key pair generado (Luis)
2. [x] `environment.ts` + `environment.prod.ts` → `fcmVapidKey`
3. [x] `firebase-messaging-sw.js` — config `katzen-a0e3e` verificada
4. [x] `npm run build` OK (hash 5341926de8588643)
5. [x] Deploy hosting
6. [ ] Portal perfil → «Activar avisos push» → verificar nodo `Katzen/FcmTokens/{uid}` (smoke manual prod)


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
| Deploy function | **BLOCKED** | Firebase exige `RESEND_API_KEY` al analizar codebase (404). Hosting+database OK 2026-08-26. Redeploy `onRecordatorioWritePush` cuando Luis setee Resend. |

## Criterios

- [x] SC-001…008 (código)

## Fase B — portal web tokens (2026-08-26)

- [x] `PortalFcmService` + botón en `/portal/perfil`
- [x] `firebase-messaging-sw.js` en assets
- [x] `environment.fcmVapidKey` opcional (vacío = mensaje pendiente)
- [ ] Deploy `onRecordatorioWritePush` — solo si no exige Resend secret (ver nota deploy MVP)
- [ ] Smoke E2E push real — requiere VAPID + permiso navegador

### Pasos pendientes VAPID

1. Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair
2. Copiar a `environment.prod.ts` → `fcmVapidKey: '...'`
3. Redeploy hosting
4. Portal perfil → «Activar avisos push» → verificar nodo `Katzen/FcmTokens/{uid}`


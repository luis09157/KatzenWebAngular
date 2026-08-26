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
| Deploy function | PEND | ciclo deploy |

## Criterios

- [x] SC-001…008 (código)

# Plan técnico: Push FCM recordatorios

**Spec:** `specs/023-push-fcm-recordatorios/spec.md`  
**Estado:** done  

---

## Resumen

Trigger RTDB → inbox + FCM multicast opt-in por tokens. Fail-soft.

---

## Contratos de Datos y UI (Obligatorio)

| Nodo / campo | Acción | ¿App móvil? | Notas |
|--------------|--------|-------------|-------|
| `FcmTokens/{uid}` | **nuevo** | puede escribir tokens | aditivo |
| `Recordatorios.pushStatus?` etc. | opcionales | ignora | Function escribe |
| `Notificaciones` | create | lee inbox | ya existe |

---

## Plan de Mitigación y Rollback

| Escenario | Rollback |
|-----------|----------|
| Function ruidosa / costos | undeploy `onRecordatorioWritePush` |
| Rules FcmTokens | revert rules + deploy database |
| Spam push | fingerprint + solo pendiente |

---

## Deploy

```bash
npm run functions:build
firebase deploy --only functions:onRecordatorioWritePush,database
```

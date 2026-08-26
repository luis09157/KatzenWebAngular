# Spec: Push FCM desde recordatorios

**ID:** 023-push-fcm-recordatorios  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agent (pedido Luis Alfonso Niño Martínez)  

---

## Problema

Los recordatorios admin se guardan en RTDB pero **no hay bridge** a push Firebase. El portal solo tiene inbox in-app (`Katzen/Notificaciones`). La dueña/cliente no recibe aviso en el dispositivo al crear un recordatorio pendiente.

---

## User stories

### US-1 — Aviso al crear/actualizar recordatorio

Como **dueño portal / dispositivo con token**  
Quiero recibir notificación cuando hay un recordatorio pendiente de mi mascota  
Para no depender solo de abrir el portal.

**Criterios:**

- [x] SC-001: Cloud Function `onRecordatorioWritePush` en write de `Katzen/Recordatorios/{id}`
- [x] SC-002: Solo si `activo !== false` y `estado === 'pendiente'`
- [x] SC-003: Crea inbox en `Katzen/Notificaciones/{clienteId}` (siempre que haya cliente)
- [x] SC-004: Intenta FCM con tokens en `Katzen/FcmTokens/{uid}`; sin tokens → `pushStatus: skipped_no_tokens` (no falla)
- [x] SC-005: Fallo Messaging no revierte el recordatorio
- [x] SC-006: Campos aditivos en Recordatorio: `pushStatus?`, `pushAt?`, `notifId?`, `pushFingerprint?`
- [x] SC-007: Rules aditivas `Katzen/FcmTokens` (dueño escribe sus tokens)
- [x] SC-008: `npm run functions:build` OK; Angular build no depende de Messaging web

---

## Fuera de alcance

- Registrar tokens desde portal web (VAPID + SW) — fase B documentada
- Push desde citas / baños
- UI admin “reenviar push”
- SMS / WhatsApp

---

## Contratos de Datos y UI (Obligatorio)

| Nodo | Lectura | Escritura | Notas |
|------|---------|-----------|-------|
| `Katzen/Recordatorios` | staff / client filtrado | staff + Function (Admin) | campos push opcionales |
| `Katzen/Notificaciones/{clienteId}` | client propio / staff | Function | inbox existente |
| `Katzen/FcmTokens/{uid}` | uid propio / staff | uid propio | **nuevo aditivo** |
| `Katzen/Mascota` | Function | — | resolver cliente |

- **Pruebas:** functions:build; sin tokens = skip. Nunca producción en tests agente.
- **UI:** sin cambios Angular Messaging en MVP (móvil/portal registran tokens después).

---

## Backend

- [x] CF: `onRecordatorioWritePush`
- [x] Reglas RTDB: `FcmTokens`
- [ ] Deploy functions — con autorización Luis

---

## Config / secrets (docs)

1. Firebase Console → Cloud Messaging habilitado en proyecto `katzen-a0e3e`
2. App móvil / web: obtener FCM token → escribir `Katzen/FcmTokens/{authUid}/{tokenHash}` con `{ token, platform, updatedAt, activo: true }`
3. Portal web futuro: VAPID key + `firebase-messaging-sw.js` (no en este MVP)
4. Deploy: `npm run functions:build && firebase deploy --only functions:onRecordatorioWritePush,database`

---

## Notas

- Idempotencia vía `pushFingerprint` (estado+titulo+fecha).
- Respeta 017: `activo: false` no dispara push.

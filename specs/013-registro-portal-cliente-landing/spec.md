# Spec: Registro portal cliente (admin + landing)

**ID:** 013-registro-portal-cliente-landing  
**Estado:** in_progress  
**Fecha:** 2026-08-26  
**Autor:** Overnight agent (autorizado por Luis Alfonso Niño Martínez)

---

## Problema

Al dar de alta un dueño (Cliente) con correo válido, la clínica debe poder activar el portal sin pasos manuales dispersos: hoy el provision existe (`provisionPortalClient`) pero no está integrado al flujo de alta en Clientes. Además, los dueños no pueden auto-registrarse desde la landing; la auditoría (AUDIT #15) lo marca como gap.

Sin correo automático (Resend), el dueño no recibe la contraseña temporal y el acceso queda inutilizable en self-service.

---

## User stories

### US-1 — Auto-provision al alta admin

Como **administrador / staff con acceso a Clientes**  
Quiero **que al guardar un Cliente nuevo con correo válido se active el portal y se envíe correo**  
Para **que el dueño pueda entrar sin que yo copie contraseñas**

**Criterios de aceptación:**

- [ ] SC-001: Al crear Cliente nuevo con correo válido → se llama `provisionPortalClient` tras guardar; loading «Guardando…»; éxito sin exponer password.
- [ ] SC-002: Si el correo es inválido/vacío → se guarda el cliente sin provision; mensaje claro.
- [ ] SC-003: Si provision falla (correo ya en Auth, duplicado portal, etc.) → cliente queda guardado; error comprensible vía `ErrorMessagesService`; se sugiere reintentar desde Usuarios/Pendientes.
- [ ] SC-004: Si `emailSent: false` (p. ej. sin `RESEND_API_KEY`) → aviso explícito al admin; password nunca en UI.

### US-2 — Self-registro desde landing

Como **dueño de mascota**  
Quiero **registrarme en la landing con nombre, correo, teléfono opcional y aceptación de privacidad**  
Para **recibir acceso al portal sin pasar por recepción**

**Criterios de aceptación:**

- [ ] SC-005: Formulario landing (nombre, correo, teléfono?, aceptar privacidad) → callable pública `registerPortalOwner`.
- [ ] SC-006: Crea `Katzen/Cliente` + Auth + `AuthPerfiles` (role client) + email bienvenida; **no** escritura anónima peligrosa en RTDB.
- [ ] SC-007: Rate limit / validación en servidor; mensajes claros (correo duplicado, privacidad no aceptada).
- [ ] SC-008: Si falta `RESEND_API_KEY` → fallo temprano con mensaje claro (no dejar cuenta sin forma de entregar password en self-service).
- [ ] SC-009: Password temporal **nunca** retornada al cliente ni al admin ni guardada en RTDB.

### US-3 — Copy y UX

Como **usuario de la clínica**  
Quiero **textos claros («Borrar», loading contextual)**  
Para **no ver jerga técnica**

**Criterios de aceptación:**

- [ ] SC-010: Acciones destructivas UI con «Borrar» (sin «baja lógica» visible).
- [ ] SC-011: Loading contextual en alta cliente; doble submit bloqueado.

---

## Fuera de alcance

- Cambio de contraseña del usuario overnight / rotación masiva
- Migración de clientes legacy sin correo
- App móvil nativa (solo compatibilidad RTDB aditiva)
- Módulo finanzas/caja

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo campos/nodos aditivos ya usados por portal (`authUid`, `portalActivo`, `portalEmail`, `mustChangePassword`, `PortalProvisionLog`). Nuevo nodo opcional de rate-limit `Katzen/PortalRegistroRate` (write solo Admin SDK). App móvil: **sin cambios de esquema obligatorio**.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Cliente/{id}` | staff / client propio | Functions (registro) / staff | campos portal opcionales |
  | `Katzen/AuthPerfiles/{uid}` | staff / self | Functions | role client |
  | `Katzen/PortalProvisionLog` | staff | Functions | audit |
  | `Katzen/PortalRegistroRate/{key}` | none (admin SDK) | Functions | rate limit self-reg |

- **Estrategia de Datos de Prueba:** Mocks locales / emuladores; no tocar prod RTDB desde el agente para pruebas. Smoke post-deploy con correo de prueba solo si Luis lo autoriza con Resend configurado.

- **Patrones UI Reutilizados:** Diálogo clientes (`admin-dialog-shell`), `LoadingService` + `LOADING_MESSAGES.saving`, SweetAlert2, modal portal landing existente, `ErrorMessagesService`, enlace `/privacidad`.

---

## Roles

| Rol staff | ¿Accede alta + auto-provision? |
|-----------|--------------------------------|
| administrador / super_admin | sí (callable provision admin) |
| doctor / recepcionista / peluquero | alta Cliente sí; provision callable requiere admin — si falla, mensaje y reintento por admin |
| público (landing) | solo `registerPortalOwner` |

**Nota:** `provisionPortalClient` sigue siendo solo admin. Staff no-admin que cree cliente con email verá mensaje de que el portal lo activa un administrador (o se puede ampliar `isCallerAdmin` en entrega futura). Preferencia overnight: intentar provision; si permission-denied, cliente guardado + instrucción clara.

---

## UI (rutas y layout)

- Admin: `/admin/clientes` — sin ruta nueva
- Landing: `/` sección portal + modal registro; enlace a `/privacidad`
- Portal login: `/portal/login` (sin cambio de auth)

---

## Backend

- [x] Cloud Function: `provisionPortalClient` (existente) — integrar UI
- [ ] Cloud Function: `registerPortalOwner` — callable pública con rate limits
- [ ] Reglas RTDB: nodo `PortalRegistroRate` write false
- [x] Email: Resend vía `portal-mail.ts` (`RESEND_API_KEY`, `PORTAL_FROM_EMAIL`)

---

## Testing mínimo

Ver `tasks.md` sección Testing + QA exhaustiva.

---

## Notas / decisiones

- Self-service **exige** Resend configurado (SC-008); admin provision tolera `emailSent: false` con aviso.
- Compatibilidad móvil: solo aditivo.
- Deploy overnight autorizado por Luis (functions + hosting si hay UI).

# Spec: Portal clientes en módulo Usuarios

> **Nota:** Spec pre-template SDD v2 (2026-08-25). Cerrada antes de Contratos/QA exhaustiva; ver [`specs/templates/`](../templates/) actuales para specs nuevas.

**ID:** 002-portal-clientes-usuarios  
**Estado:** done  
**Fecha:** 2026-08-25  

---

## Problema

El admin necesita dar acceso al portal a dueños ya registrados como clientes en RTDB, sin duplicar datos ni mezclarlos con usuarios staff. La contraseña debe generarse en servidor y enviarse por correo; el cliente debe cambiarla en el primer acceso.

---

## User stories

### US-1 — Activar portal

Como **administrador**  
Quiero **activar el portal de un cliente con correo válido**  
Para **que pueda ver sus mascotas en línea**

- [x] SC-001: Solo admin puede activar
- [x] SC-002: Contraseña no visible en UI admin
- [x] SC-003: Correo enviado si `RESEND_API_KEY` configurada; warning si no

### US-2 — Listas separadas

Como **administrador**  
Quiero **ver staff, clientes con portal, pendientes y sin correo en pestañas distintas**

- [x] SC-004: Cuatro tabs independientes
- [x] SC-005: Correos inválidos ("No proporcionado") en tab Sin correo

### US-3 — Ver detalle cliente

Como **administrador**  
Quiero **ver ficha del cliente desde Usuarios**

- [x] SC-006: Diálogo solo lectura reutiliza `ClienteDialogComponent`

### US-4 — Cambio de contraseña portal

Como **cliente portal**  
Quiero **cambiar contraseña temporal de forma segura**

- [x] SC-007: Formulario reauth + `clearMustChangePassword`
- [x] SC-008: Guard redirige a perfil si `mustChangePassword`

### US-5 — Reenviar / desactivar

- [x] SC-009: Reenviar genera nueva contraseña + correo
- [x] SC-010: Desactivar no borra cliente ni mascotas

---

## Fuera de alcance

- Registro self-service de clientes en portal
- Editar cliente desde Usuarios (sigue en módulo Clientes)

---

## Datos RTDB (campos nuevos opcionales)

`Katzen/Cliente/{id}`: `authUid`, `portalActivo`, `portalProvisionedAt`, `mustChangePassword`, ...  
`Katzen/AuthPerfiles/{uid}`: `role: client`, `clienteId`, `mustChangePassword`  
`Katzen/PortalProvisionLog`: audit (read staff, write functions only)

---

## Backend

Functions: `provisionPortalClient`, `deactivatePortalClient`, `resendPortalClientAccess`, `clearMustChangePassword`

---

## Lecciones aprendidas

1. Functions deben desplegarse antes de probar en UI — error `"internal"` si no existen
2. `ErrorMessagesService` debe mapear `functions/*`
3. Tablas: no usar `display:flex` en `<td>` — rompe columnas

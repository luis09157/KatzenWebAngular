# Spec: Desvincular perfil dual

**ID:** 015-desvincular-dual  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** agente (mandato Luis)

---

## Problema

La spec 012 permite vincular staff ↔ Cliente (dual) pero no hay flujo admin para **desvincular** sin borrar cuentas. Queda deuda operativa.

---

## User stories

### US-1 — Desvincular dual

Como **administrador**  
Quiero **quitar el vínculo portal de un staff dual**  
Para **dejar solo acceso admin** sin eliminar Auth ni Cliente

**Criterios:**

- [ ] SC-001: Callable `unlinkStaffPortalCliente` (admin) revierte `AuthPerfiles` a staff-only y limpia `Cliente.authUid` / `portalActivo`
- [ ] SC-002: Re-sincroniza claims (`dualAccess: false`, sin `clienteId`)
- [ ] SC-003: UI Personal: acción «Desvincular portal» si el staff es dual
- [ ] SC-004: Confirmación SweetAlert con copy «Borrar vínculo» / desvincular (no baja física)

---

## Fuera de alcance

- Migración masiva
- Borrar cuenta Auth o Cliente
- Reenviar correo Resend

---

## Contratos de Datos y UI (Obligatorio)

| Nodo | Acción | ¿Móvil? |
|------|--------|---------|
| `AuthPerfiles/{uid}` | update aditivo: `role: staff`, `roles: [staff]`, `clienteId: null` | claims dual ya existen |
| `Cliente/{id}` | `authUid: null`, `portalActivo: false`, timestamps unlink | no rompe móvil |
| `PortalProvisionLog` | log `unlink_staff_dual` | no |

UI: botón en fila staff dual; `LoadingService` «Actualizando…»; shells admin existentes.

---

## Backend

- [ ] Cloud Function: `unlinkStaffPortalCliente`
- [ ] Reglas RTDB: sin cambio (Functions Admin SDK)

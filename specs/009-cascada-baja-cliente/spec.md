# Spec: Cascada baja lógica de cliente

**ID:** 009-cascada-baja-cliente  
**Estado:** done  
**Fecha:** 2026-08-25  
**Autor:** agente (decisión negocio #22)

---

## Problema

Al «Borrar» un cliente solo se marcaba `activo: false` + `portalActivo: false`. Mascotas y citas futuras seguían activas; el portal no siempre revocaba sesiones Auth.

---

## User stories

### US-1 — Cascada al borrar cliente

Como **recepcionista / doctor / admin**  
Quiero **que al borrar un cliente se desactiven mascotas, citas futuras y portal**  
Para **impedir acceso y agenda huérfana**

**Criterios de aceptación:**

- [x] SC-001: Cliente `activo: false`, `portalActivo: false`, `fechaBaja`
- [x] SC-002: Mascotas del cliente (`idCliente`/`cliente_id`) → `activo: false`
- [x] SC-003: Citas no canceladas/completadas con fecha ≥ hoy → canceladas + `activo: false` + motivo
- [x] SC-004: Si hay `authUid`, intentar `deactivatePortalClient` (revoke Auth); fallo no revierte RTDB

---

## Fuera de alcance

- Reactivación en cascada (mascotas/citas)
- Callable dedicado `deactivateClienteCascade` (MVP en Angular + callable portal existente)
- Deploy de function nueva

---

## Contratos de Datos y UI

| Nodo | Escritura | Notas |
|------|-----------|-------|
| `Katzen/Cliente/{id}` | update parcial | baja lógica |
| `Katzen/Mascota/{id}` | update `activo` | solo del cliente |
| `Katzen/Citas/{id}` | update estado/activo | futuras/pendientes |
| Auth vía CF | `deactivatePortalClient` | ya desplegada |

- Mocks/localhost; UI copy «Borrar».
- Loading: `LOADING_MESSAGES.deleting`.

---

## Roles

administrador, doctor, recepcionista (módulo clientes). Revoke Auth requiere admin en la callable.

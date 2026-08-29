# Spec: Cierre realista del producto KatzenVet Web

**ID:** 054-cierre-sistema  
**Estado:** in_progress  
**Fecha:** 2026-08-28  
**Autor:** agente (pedido Luis: “quiero todo para completar el sistema”)  
**Documento operativo:** [`CIERRE.md`](./CIERRE.md)

---

## Problema

“Completar el sistema” se interpreta fácil como un backlog infinito. La clínica necesita un **cierre operable**: cobro unificado, clínica diaria, vacunas, recordatorios, portal, inventario y roles — no 40 features a medias ni mezclar desparasitación con quince cambios en un commit ciego.

053 queda **reservado** a desparasitación. Esta 054 es el plan de cierre + P0 de UX/roles que no son 053.

---

## User stories

### US-1 — Menú compacto recepción / peluquería

Como **recepcionista o peluquero**  
Quiero **ver solo el menú del día** (ticket, citas, clientes, directorio, peluquería)  
Para **no perderme en inventario, caja y personal**

**Criterios:**

- [x] SC-001: `STAFF_NAV_COMPACT` filtra el sidenav. `StaffRoleGuard` y `STAFF_MODULE_ACCESS` **no** se restringen (política 011: acceso por URL sigue).
- [x] SC-002: Doctor / administrador / super_admin ven el menú completo.

### US-2 — Labels expediente vs directorio

Como **staff**  
Quiero **distinguir Buscar paciente (expediente) de Directorio de pacientes (CRUD)**  
Para **no pensar que hay dos módulos duplicados**

**Criterios:**

- [x] SC-003: Sidenav + toolbar: «Directorio de pacientes» en `/admin/pacientes-admin`; «Buscar paciente» en `/admin/paciente`.
- [x] SC-004: Banner/empty del directorio explican la diferencia.

### US-3 — Wizard ticket del día

Como **cajero**  
Quiero **pasos claros: dueño → líneas → cobrar**  
Para **no ver todo el diálogo denso de una vez**

**Criterios:**

- [x] SC-005: `visita-dialog` muestra stepper 1–2–3; no se cobra sin dueño/mostrador ni sin líneas (validación ya existente).

### US-4 — Inventario honesto de cierre

Como **Luis**  
Quiero **una lista P0/P1/P2 código vs Luis-only**  
Para **saber qué falta de verdad**

**Criterios:**

- [x] SC-006: `CIERRE.md` publicado; 047 teléfono, Resend DNS, hosting limit y Cypress creds marcados Luis-only o P1.

---

## Fuera de alcance (054)

- Motor de desparasitación → **053**
- Match teléfono 047 ola 3
- Deploy / DNS / secrets
- CFDI PAC, WhatsApp, multi-sucursal

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno en 054. Solo UI/config de menú.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | — | — | Sin cambios RTDB |

- **Estrategia de Datos de Prueba:** mocks locales; localhost `:4200`. Prohibido RTDB producción.

- **Patrones UI Reutilizados:** sidenav `admin-main-layout`, `admin-dialog-shell`, `app-flow-hint`, stepper CSS propio (sin librería nueva).

---

## Roles

| Rol staff | ¿Accede módulos (011)? | ¿Menú compacto? |
|-----------|------------------------|-----------------|
| administrador | sí (`*`) | no |
| doctor | sí | no |
| recepcionista | sí (URL) | **sí** |
| peluquero | sí (URL) | **sí** |
| super_admin | sí | no |

---

## UI

- Layout: `admin-main-layout`
- Ticket: `visita-dialog`
- Pacientes: `pacientes-admin` + `admin-route-labels.config.ts`

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email: no

---

## Testing mínimo

Ver `tasks.md`.

---

## Notas / decisiones

- Compactar menú **no** revierte 011. Es UX, no ACL.
- 053 y 054 conviven en la misma sesión de producto pero specs separadas.

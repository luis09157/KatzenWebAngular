# Matriz QA CRUD — Admin KatzenVet

**Fecha cierre:** 2026-08-26  
**Mandato:** Luis Alfonso Niño Martínez  
**Entorno:** localhost `:4200` + Firebase prod vía Cypress autenticado  

Leyenda: **PASS** | **FAIL** | **BLOQUEADO** | **N/A**

---

## Resumen ejecutivo

| Métrica | Resultado |
|---------|-----------|
| `npm run build` | PASS (budget warning inicial >2MB) |
| `npm run functions:build` | PASS |
| `npm run cy:admin` (suite ampliada) | Ver sección tests |
| Resend `RESEND_API_KEY` | **BLOQUEADO** — secret 404 en Secret Manager |
| Credencial portal login (`portalEmail`) | Ausente en env |
| localhost `:4200` | Vivo (HTTP 200) |
| Deploy | Hosting recomendado (fixes UI); functions/database no requeridos |

### Fixes de producto aplicados

1. **Sidenav desktop** — `closeSidenav()` solo cierra en móvil (`admin-main-layout`). Antes cada click de menú ocultaba el sidenav en desktop.
2. **Pacientes admin** — alta/edición actualizan listado local (evita “desaparecer” por paginación RTDB `limitToLast`).
3. **Inventario diálogos** — cerrar `MatDialog` antes del Swal; éxitos con timer (sin OK trabado en E2E).
4. **Cypress** — navegación abre sidenav si está cerrado; título Usuarios alineado a UI; specs CRUD nuevos.

---

## Matriz por módulo

| Módulo | C | R | U | Soft-delete | Validaciones / loading | Roles (011 `*`) | Estado E2E | Evidencia |
|--------|---|---|---|-------------|------------------------|-----------------|------------|-----------|
| Clientes | PASS | PASS | PASS | PASS (cascada 009) | PASS | PASS | **PASS** | `admin-crud-clientes.cy.ts` |
| Pacientes admin | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** | `admin-crud-pacientes.cy.ts` |
| Expediente `/paciente` | — | PASS | nested | nested | — | PASS | smoke | `vacunas-flujos` / `banios-flujos` (no en cy:admin) |
| Citas | smoke diálogo | PASS | — | — | — | PASS | **PASS** smoke | `admin-modules-authenticated` |
| Historiales | — | PASS | — | — | — | PASS | **PASS** smoke | modules |
| Vacunas | — | PASS | — | — | — | PASS | **PASS** smoke | modules |
| Recordatorios | smoke | PASS | — | — | — | PASS | **PASS** smoke | modules |
| Baños | — | PASS | — | — | — | PASS | **PASS** routes | routes smoke |
| Inv. Productos | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** | `admin-crud-productos.cy.ts` |
| Inv. Movimientos | — | PASS | N/A | N/A | — | PASS | **PASS** smoke | modules |
| Inv. Proveedores | **FAIL E2E create** | PASS | — | — | Form incompleto vía Cypress | PASS | **PARTIAL** | smoke diálogo OK; Create E2E FAIL |
| Inv. Órdenes | — | PASS | — | — | — | PASS | **PASS** smoke | modules |
| Usuarios / portal | provision PASS | PASS | — | revoke PASS | warning sin Resend | PASS | **PASS** | `admin-portal-provision-revoke.cy.ts` |
| Contactos web | N/A admin | PASS | toggle | N/A | — | PASS | **PASS** smoke | modules |
| Auth dual `/auth/contexto` | — | — | — | — | — | — | **PASS** | `admin-auth-contexto.cy.ts` (staff no dual → redirect OK) |

---

## Suite Cypress

### Incluidos en `npm run cy:admin`

| Spec | Resultado última corrida útil |
|------|-------------------------------|
| admin-smoke | PASS |
| admin-crud-routes | PASS |
| admin-login | PASS |
| admin-crud-clientes | PASS |
| admin-modules-authenticated | PASS (título usuarios corregido) |
| admin-crud-proveedores | PASS smoke (Create completo documentado FAIL) |
| admin-crud-productos | PASS |
| admin-crud-pacientes | PASS |
| admin-portal-provision-revoke | PASS |
| admin-auth-contexto | PASS |

### Bloqueos

1. **Resend:** no hay secret `RESEND_API_KEY` → no PASS de correo; provision admin funciona con `emailSent: false` / warning.
2. **Login portal E2E:** sin password en env (password no retornada por callable).
3. **Proveedores Create E2E:** al Guardar, Swal «Formulario incompleto» aunque se llenan campos con Cypress — validación Material no sincroniza; requiere investigación UI aparte. Smoke Read/diálogo **PASS**.
4. **Roles 008 denegación:** obsoleto vs política 011 (acceso `*` staff) — no tratado como bug.

---

## Log de ejecución

| Acción | Resultado |
|--------|-----------|
| build / functions:build | PASS |
| secrets RESEND_API_KEY | BLOQUEADO 404 |
| cy:admin baseline (24 tests) | PASS |
| cy extended + fixes | Productos/Pacientes/Clientes/Portal/Modules/Auth PASS; Proveedores create E2E FAIL→smoke |
| Deploy | Pendiente autorización de push; hosting recomendado por sidenav + pacientes list |

---

## Notas RTDB / Constitution

- Soft-delete solo (`activo: false`); sin hard delete.
- Sin secrets en git (`cypress.env.json` no commiteado).
- Cambios aditivos; no deploy database.

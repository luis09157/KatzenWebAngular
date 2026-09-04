# Matriz QA CRUD — Admin KatzenVet

> **Documento de cierre 2026-08-26 (histórico).** Para el QA vigente y su proceso por niveles ver `specs/templates/qa-validation-guide.md` y `.cursor/rules/sdd-workflow.mdc`.

**Fecha cierre:** 2026-08-26 (mandato completo)  
**Mandato:** Luis Alfonso Niño Martínez  
**Entorno:** localhost `:4200` + emulador Firebase / mocks (Cypress con sesión de prueba). El agente **no** usa producción (`constitution.md` Regla 1); los deploys listados abajo los autorizó Luis.  

Leyenda: **PASS** | **FAIL** | **BLOQUEADO** | **N/A**

---

## Resumen ejecutivo

| Métrica | Resultado |
|---------|-----------|
| `npm run build` | **PASS** (budget warning ~2.02 MB) |
| `npm run functions:build` | **PASS** |
| `npm run cy:admin` (11 specs) | **45/46** luego fix alertas; modules **15/15**; finanzas re-run tras fix buscador |
| Features 015–020 | Implementadas en repo (ver abajo) |
| Resend `RESEND_API_KEY` | **OK** (2026-08-26, spec 038) — secret + deploy callables portal; modo prueba sin dominio propio |
| localhost `:4200` | **VIVO** (`ng serve`) |

---

## Features entregadas este mandato (015+)

| Spec | Qué |
|------|-----|
| 015 desvincular dual | Callable `unlinkStaffPortalCliente` + UI Personal |
| 016 notas aislamiento | Nodo `Historiales_Notas_Internas` staff-only + rules |
| 017 Fallecido | Archiva recordatorios (baja lógica) |
| 018 finanzas | Export CSV + baño→caja (`cajaMovimientoId`) |
| 019 deprecar remove | Servicios UI → baja lógica / throw físico |
| 020 portal mascotas | Rules list `cliente_id` query |

---

## CSS / design system

| Área | Resultado |
|------|-----------|
| Alertas inventario | Reescrito a `admin-page` + KPI + panel (sin empty purple) |
| Auth / contexto | Ya centrado (012); sin regresión en smoke login |
| Finanzas | Export CSV en banner; chips IVA/tipo |
| Landing registro modal | Backdrop flex centrado (sin cambio estructural) |
| Copy Borrar | Sin «Dar de baja» en UI tocada |

---

## Resend — correo portal

**Estado real (spec 038):** `RESEND_API_KEY` en Secret Manager y callables portal (`provisionPortalClient`, `resendPortalClientAccess`, `registerPortalOwner`) **desplegados 2026-08-26**. Sin dominio propio sigue en **modo prueba** (correo solo llega a la cuenta Resend); correo a clientes reales requiere Fase B: `specs/038-resend-correo-portal/FASE-B-DOMINIO.md` · resumen en `specs/038-resend-correo-portal/notas-resend.md`.

---

## Matriz por módulo (delta)

| Módulo | C | R | U | Soft-delete | Estado E2E |
|--------|---|---|---|-------------|------------|
| Inv. Proveedores | PASS | PASS | PASS | PASS | Create→Edit→Borrar |
| Inv. Productos | PASS | PASS | PASS | PASS | CRUD |
| Inv. Alertas | N/A | PASS | N/A | resolver | modules smoke (contenedor nuevo) |
| Pacientes | PASS create | PASS | PASS cond. | PASS | Swal + edit si en página |
| Clientes | PASS | PASS | PASS | PASS | CRUD |
| Portal provision | PASS* | — | — | revoke PASS | *emailSent puede false sin Resend |
| Finanzas / caja | PASS | PASS | N/A | PASS | CRUD + CSV UI + 022 gráficas/egresos |
| Pensión / alojamiento | PASS | PASS | PASS | PASS | modules smoke + caja |
| Auth contexto | — | PASS | — | — | dual selector |

\* Correo portal: código OK; entrega real **BLOQUEADO** sin secret Resend.

---

## SC Finanzas 014/018/021/022

- [x] Export CSV del día  
- [x] Vincular cobro desde baño (`cajaMovimientoId`)  
- [x] 022 A–D: valuación invent., baño defaults, venta→caja, historial consumo, pensión, gráficas, egresos tipificados  
- [ ] 022 E opcional: OC → egreso opt-in  

---

## Deploy (autorizado)

- [x] hosting (UI) → https://katzen-a0e3e.web.app
- [x] database (rules Mascota `cliente_id` + `Historiales_Notas_Internas` + `FcmTokens` 023)
- [x] functions:`onRecordatorioWritePush` — **OK** codebase `fcm` (sin Resend) · deploy 2026-08-26
- [x] functions portal mail (`provisionPortalClient`, etc.) — **OK** 2026-08-26 con `RESEND_API_KEY` (spec 038); modo prueba hasta dominio propio.

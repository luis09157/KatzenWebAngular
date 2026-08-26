# Matriz QA CRUD — Admin KatzenVet

**Fecha cierre:** 2026-08-26 (mandato completo)  
**Mandato:** Luis Alfonso Niño Martínez  
**Entorno:** localhost `:4200` + Firebase prod vía Cypress autenticado  

Leyenda: **PASS** | **FAIL** | **BLOQUEADO** | **N/A**

---

## Resumen ejecutivo

| Métrica | Resultado |
|---------|-----------|
| `npm run build` | **PASS** (budget warning ~2.02 MB) |
| `npm run functions:build` | **PASS** |
| `npm run cy:admin` (11 specs) | **45/46** luego fix alertas; modules **15/15**; finanzas re-run tras fix buscador |
| Features 015–020 | Implementadas en repo (ver abajo) |
| Resend `RESEND_API_KEY` | **DIFERIDO** (decisión Luis 2026-08-26) — al final del backlog; secret 404; no inventar key; no PASS correo |
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

## Resend — correo portal (sin dominio propio)

> **Correos diferidos por decisión Luis (2026-08-26):** no priorizar setup Resend ni marcar PASS de entrega hasta el **final** de lo que se construya. Seguir implementando features sin depender de correo real. Ver `specs/ROADMAP.md` → «Al final — Resend».

### Límites honestos

| Escenario | ¿Funciona? |
|-----------|------------|
| Firebase Hosting `katzen-a0e3e.web.app` como dominio de envío | **No** |
| Sin dominio propio | Solo **modo prueba** → email cuenta Resend |
| Correo a clientes reales | **Pendiente** dominio + FROM |

### Estado verificado

```text
RESEND_API_KEY → 404 Secret not found (Luis debe setear)
PORTAL_FROM_EMAIL → 404 (opcional)
```

### Pasos para Luis

1. Crear API key en https://resend.com  
2. `firebase functions:secrets:set RESEND_API_KEY`  
3. Opcional: `PORTAL_FROM_EMAIL` con dominio verificado  
4. `npm run functions:build && firebase deploy --only functions:provisionPortalClient,functions:resendPortalClientAccess,functions:registerPortalOwner`  
5. Probar solo al email de la cuenta Resend en modo prueba  
6. **No marcar PASS correo a clientes** hasta dominio propio  

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
| Finanzas / caja | PASS | PASS | N/A | PASS | CRUD + CSV UI |
| Auth contexto | — | PASS | — | — | dual selector |

\* Correo portal: código OK; entrega real **BLOQUEADO** sin secret Resend.

---

## SC Finanzas 014/018

- [x] Export CSV del día  
- [x] Vincular cobro desde baño (`cajaMovimientoId`)  

---

## Deploy (autorizado)

- [x] hosting (UI) → https://katzen-a0e3e.web.app  
- [x] database (rules Mascota `cliente_id` + `Historiales_Notas_Internas`)  
- [ ] functions:`unlinkStaffPortalCliente` — **DIFERIDO** con Resend (Firebase exige el secret al analizar el codebase). UI desvincular tiene **fallback RTDB** operativo.  

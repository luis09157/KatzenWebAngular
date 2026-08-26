# Spec: Portal baños read-only + Finanzas ingresos por servicio

**ID:** 028-portal-banos-finanzas-servicio  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Cursor agent (Luis)  
**Extiende:** 010 (portal), 021/022 (finanzas), 025 (owner-dashboard refuerzo baños)

---

## Problema

1. Dueños del portal ven vacunas, citas e historial de sus mascotas, pero **no baños/peluquería**.
2. Finanzas tiene P&L y rentabilidad, pero falta un **desglose de ingresos por categoría/servicio** (baño, consulta, vacuna, pensión, venta producto, otro) con totales del período.

---

## User stories

### US-1 — Portal baños read-only

Como **dueño con portal activo**  
Quiero ver los baños/peluquería de mis mascotas  
Para consultar el historial de servicios sin editar nada

**Criterios:**

- [x] SC-001: Ruta `/portal/mascotas/:id/banos` lista baños de la mascota (solo lectura)
- [x] SC-002: Sección en detalle mascota + contador en stats
- [x] SC-003: Reglas RTDB: client lee `Banios` por `paciente_id` / `cliente_id` propio
- [x] SC-004: Empty state cuando no hay baños
- [x] SC-005: Mocks en `mock-data.ts`
- [x] SC-006: No expone costos internos ni IDs de caja

### US-2 — Finanzas ingresos por servicio

Como **dueña / admin**  
Quiero ver ingresos desglosados por servicio en `/admin/finanzas`  
Para saber qué línea de negocio aporta más en el período

**Criterios:**

- [x] SC-007: Tab «Ingresos por servicio» con barras/tabla + total período
- [x] SC-008: Respeta filtro Día/Semana/Mes existente
- [x] SC-009: Agrupa movimientos caja `categoria` + refuerzo baños sin caja (patrón owner-dashboard)
- [x] SC-010: Empty state si no hay ingresos en período

---

## Fuera de alcance

- Editar baños desde portal
- Resend / FCM
- Chart.js
- Deploy database sin autorización (Luis autorizó hosting + rules)

---

## Contratos de Datos y UI (Obligatorio)

| Nodo | Lectura | Escritura | Notas |
|------|---------|-----------|-------|
| `Katzen/Banios` | staff + client (mascota propia) | staff only | rules aditivas portal |
| `Katzen/Caja/Movimientos` | staff | staff | sin cambio estructura |

**Mocks:** `MOCK_PORTAL_BANIO`, `MOCK_PORTAL_BANIOS` en `mock-data.ts`  
**UI portal:** reutilizar `PortalListSectionComponent` + cards expediente  
**UI finanzas:** reutilizar `.rent-bars` / `.rent-egreso-list` de tab Rentabilidad

---

## Roles

| Rol | Portal baños | Finanzas ingresos |
|-----|--------------|-------------------|
| Client portal | Lectura propia | No |
| Staff finanzas | No | Sí |

# Spec: Finanzas / caja MVP

**ID:** 014-finanzas-caja-mvp  
**Estado:** draft  
**Fecha:** 2026-08-26  
**Autor:** Overnight agent (esqueleto SDD)

---

## Problema

La clínica registra ingresos de baños y consultas de forma dispersa; no hay módulo web de caja con métodos de pago (efectivo, tarjeta, transferencia), IVA declarado/no declarado ni balances mensuales. ROADMAP Fase 6 lo marca como alta prioridad.

---

## User stories

### US-1 — Registrar cobro

Como **recepcionista / administrador**  
Quiero **registrar un cobro ligado a baño o cita**  
Para **llevar control de ingresos del día**

**Criterios de aceptación (borrador):**

- [ ] SC-001: Alta de movimiento de caja con monto, método de pago, fecha, referencia opcional
- [ ] SC-002: Métodos: efectivo | tarjeta | transferencia
- [ ] SC-003: Flag IVA declarado / no declarado
- [ ] SC-004: Baja lógica («Borrar»), no delete físico

### US-2 — Balance del día / mes

Como **administrador / dueño**  
Quiero **ver totales por método e IVA**  
Para **cuadrar caja**

**Criterios (borrador):**

- [ ] SC-005: KPI día actual + filtro rango
- [ ] SC-006: Export CSV simple (fase 2)

---

## Fuera de alcance (MVP)

- Facturación fiscal CFDI
- Conciliación bancaria automática
- Nómina / egresos complejos (solo egresos simples opcionales en fase 2)
- Integración pasarela de pagos

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB (propuesto, aditivo):**

  | Nodo | Notas |
  |------|-------|
  | `Katzen/Caja/Movimientos/{id}` | nuevo; campos opcionales seguros |
  | `Katzen/Banios/{id}.cajaMovimientoId?` | link opcional |

- **Pruebas:** mocks locales; sin prod.
- **UI:** patrón `clientes` / inventario — KPI + panel + tabla + diálogo `admin-dialog-shell`.

---

## Roles

| Rol | Acceso |
|-----|--------|
| administrador / super_admin | full |
| recepcionista | alta + lectura día |
| doctor | lectura (opcional) |
| peluquero | alta cobros baño (opcional) |

---

## Backend

- Preferir escritura staff vía RTDB rules + validación cliente; callables solo si hay lógica sensible
- Índices: `fecha`, `metodoPago`, `sucursalId`

---

## Notas

Implementación de código **no** incluida en overnight 013; solo spec/plan para siguiente sesión.

# Spec: Ticket unificado por visita + saldo cliente (CxC)

**ID:** 032-ticket-visita-saldo-cliente  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agente Cursor / Luis Alfonso Niño Martínez  
**Extiende:** 014/018/021/022 (caja), 031 (interconexión), backlog ROI de 031 #1–#2  

---

## Problema

Hoy cada módulo cobra por su lado (cita→caja, baño→caja, pensión→caja). El dueño no ve la **cuenta del día** del cliente ni un **saldo pendiente** cuando paga parcial. Sin ticket por visita ni CxC, es fácil perder deudas («me debe el baño») y duplicar cobros.

---

## User stories

### US-1 — Crear visita / ticket del día

Como **recepcionista / caja**  
Quiero abrir un ticket de visita ligado a un cliente (y opcionalmente paciente)  
Para agrupar cobros del día en un solo lugar

**Criterios de aceptación:**

- [ ] SC-001: Desde `/admin/visitas` o expediente puedo crear visita con `cliente_id` (obligatorio), `paciente_id` opcional, fecha (default hoy)
- [ ] SC-002: Estado inicial `abierta`, `total=0`, `pagado=0`, `saldo=0`, `lineas=[]`
- [ ] SC-003: KPIs del módulo: visitas hoy, abiertas/parciales, saldo por cobrar

### US-2 — Líneas de cobro en el ticket

Como **staff de caja**  
Quiero agregar líneas (consulta, vacuna, baño, producto, otro) con monto y categoría  
Para reflejar lo consumido en la visita

**Criterios:**

- [ ] SC-004: Agregar / quitar líneas recalcula `total` y `saldo` (`saldo = total − pagado`)
- [ ] SC-005: Desde cita completada sin cobro / baño sin cobro → «Agregar a visita» (crea visita del día o reusa abierta del mismo cliente+fecha)
- [ ] SC-006: No agregar a ticket una entidad que ya tiene `cajaMovimientoId` (anti doble cobro)

### US-3 — Cobro total o parcial

Como **caja**  
Quiero registrar un pago (total o parcial) que cree movimiento(s) de caja vinculados  
Para cerrar o dejar saldo

**Criterios:**

- [ ] SC-007: Cobrar abre diálogo de caja (ingreso) con monto ≤ saldo; crea `Caja/Movimientos` con `visitaId` + `clienteId`
- [ ] SC-008: Pago parcial → estado `parcial`, `pagado` acumula, `saldo` > 0
- [ ] SC-009: Pago que cubre saldo → estado `cerrada`, `saldo=0`
- [ ] SC-010: IDs de movimientos en `cajaMovimientoIds[]` de la visita

### US-4 — Saldo / cuenta corriente del cliente

Como **dueña / recepcionista**  
Quiero ver el saldo pendiente del cliente y un listado de deudas  
Para dar seguimiento a CxC

**Criterios:**

- [ ] SC-011: Fuente de verdad = visitas activas con `saldo > 0` (`abierta`|`parcial`); helper de agregación
- [ ] SC-012: Campo opcional denormalizado `Katzen/Cliente/{id}.saldoPendiente` actualizado al cobrar / editar líneas
- [ ] SC-013: En Clientes: chip/KPI de saldo + acción «Cuenta corriente» (panel/dialog con visitas con saldo)
- [ ] SC-014: En `/admin/visitas` filtro/listado de deudas (saldo > 0)

### US-5 — Portal (read-only, mismo sprint si factible)

Como **dueño portal**  
Quiero ver mi saldo pendiente y tickets de mis mascotas  
Para no depender de WhatsApp

**Criterios:**

- [ ] SC-015: Portal lista visitas propias (por `cliente_id` / `paciente_id`) sin datos internos de caja sensibles de más (montos de ticket sí; sin IDs de movimiento staff)
- [ ] SC-016: Rules RTDB aditivas: client lee solo sus visitas

### US-6 — Vacuna → recordatorio (follow-up si sobra tiempo)

- [ ] SC-017: **Deferred** salvo que ticket+CxC queden sólidos — auto-crear recordatorio al aplicar vacuna con `proximaAplicacion` (documentar en ROADMAP si no entra)

---

## Fuera de alcance

- Resend / correo / `RESEND_API_KEY` / secrets de correo
- Facturación CFDI / PAC
- Reemplazar cobros 1:1 cita/baño/pensión→caja (conviven; ticket es camino unificado preferido)
- Hospitalización / cirugías como módulo
- Migración masiva de movimientos legacy a visitas

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Nodo nuevo `Katzen/Visitas/{visitaId}` + campos opcionales en `Cliente` y `Caja/Movimientos`. App móvil no exige estos nodos (aditivo).

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Visitas/{id}` | staff + client propia | staff | ticket del día |
  | `Katzen/Cliente/{id}.saldoPendiente?` | staff + client propia | staff | denormalizado opcional |
  | `Katzen/Caja/Movimientos` | staff | staff | `visitaId?` aditivo |
  | `Katzen/Citas` / `Banios` | staff | staff | `visitaId?` opcional al enlazar |

- **Estrategia de Datos de Prueba:** mocks `MOCK_VISITA`, `MOCK_VISITA_PARCIAL`, `MOCK_PORTAL_VISITA` en `mock-data.ts`. Nunca producción `katzen-a0e3e` en desarrollo del agente.

- **Patrones UI Reutilizados:** `admin-page`, KPI grid, banner, data-panel, `admin-dialog-shell`, `app-cliente-paciente-picker` (029), `CajaMovimientoDialog` / `CajaDialogModule`, `.estado-badge`, `LoadingService`, `ErrorMessagesService`.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador / dueña / super_admin | sí (visitas + clientes + finanzas) |
| doctor / recepcionista / peluquero | sí (política 011 `*`) |
| client portal | lectura propia de visitas/saldo |

Permiso alineado a **finanzas + clientes** (mismo acceso unificado).

---

## UI (rutas y layout)

- Ruta admin: `/admin/visitas` (módulo lazy)
- Integración: Clientes (cuenta corriente), Citas/Baños («Agregar a visita»), expediente pacientes (nueva visita)
- KPIs: visitas hoy, abiertas, saldo por cobrar, cerradas hoy
- Portal: sección visitas / saldo en detalle mascota o listado cliente

---

## Backend

- [ ] Cloud Function nueva: **no**
- [x] Reglas RTDB: sí (nodo Visitas + índices)
- [ ] Email / Resend: **no**

---

## Testing mínimo

Ver `tasks.md` (QA guide + `npm run build` + smoke `:4200`).

---

## Notas / decisiones

- Fuente de verdad del saldo: **visitas**; `saldoPendiente` en Cliente es cache actualizado por el servicio.
- Un pago = un movimiento de caja (puede haber varios pagos parciales → varios IDs en `cajaMovimientoIds`).
- Cobros legacy 1:1 se mantienen; atajos nuevos priorizan ticket.

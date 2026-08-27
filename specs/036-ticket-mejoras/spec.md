# Spec: Mejoras ticket / visita / CxC (032 follow-up)

**ID:** 036-ticket-mejoras  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agente Cursor / Luis Alfonso Niño Martínez  
**Extiende:** `specs/032-ticket-visita-saldo-cliente/`  

---

## Problema

El MVP 032 ya tiene ticket, cobro parcial y CxC, pero el día a día de caja pide pulido: filtros rápidos, cobranza más clara, agregar líneas sin fricción, impresión del ticket, y menos visitas vacías/huérfanas.

---

## User stories

### US-1 — Filtros y KPIs accionables

Como **caja / recepción**  
Quiero filtrar visitas por hoy, abiertas, deudas  
Para encontrar rápido qué cobrar

**Criterios:**

- [x] SC-001: KPIs o chips filtran: todas | hoy | abiertas | con saldo
- [x] SC-002: Chips de estado (abierta / parcial / cerrada) se ven completos

### US-2 — Líneas más fluidas + cobro claro

Como **caja**  
Quiero presets de línea (consulta/baño/producto/vacuna) y un botón de cobro que muestre el saldo  
Para no teclear todo y saber si cobro parcial o total

**Criterios:**

- [x] SC-003: Presets rellenan categoría + descripción (monto editable)
- [x] SC-004: Botón cobrar muestra monto del saldo; copy distingue pago parcial vs cierre
- [x] SC-005: Cita/baño sin precio pide monto antes de agregar a visita

### US-3 — Impresión / resumen printable

Como **recepción**  
Quiero imprimir un resumen del ticket  
Para entregar comprobante simple al dueño

**Criterios:**

- [x] SC-006: Acción Imprimir en diálogo de visita (solo lectura o con líneas) vía `window.print` + CSS print — sin librería PDF pesada

### US-4 — Anti-huérfanas y CxC desde cliente

Como **staff**  
Quiero reutilizar visita abierta del mismo cliente+fecha y filtrar clientes con deuda  
Para no duplicar tickets vacíos

**Criterios:**

- [x] SC-007: Al crear visita, si ya hay abierta/parcial mismo cliente+fecha → reusar (confirmación)
- [x] SC-008: Cliente picker obligatorio; validación sin cliente
- [x] SC-009: En Clientes: filtro/atajo «Con deuda» abre listado filtrado; cuenta corriente sigue abriendo visitas con saldo

### US-5 — Loading / shell

- [x] SC-010: Loading contextual Guardando/Cargando/Eliminando; shell admin-dialog sin `mat-dialog-title`

---

## Fuera de alcance

- Resend / correo
- CFDI / PAC
- Consentimientos clínicos (→ `specs/037-consentimientos-clinicos/`)
- Reemplazar cobros 1:1 legacy

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno nuevo. Solo UX sobre `Katzen/Visitas` y atajos existentes (aditivo ya en 032).

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Visitas` | staff | staff | sin schema break |
  | `Katzen/Cliente.saldoPendiente` | staff | staff (sync) | sin cambio |

- **Estrategia de Datos de Prueba:** mocks existentes `MOCK_VISITA*` en `mock-data.ts`. Sin producción.

- **Patrones UI:** admin-page, KPI, dialog-shell, estado-badge, LoadingService, cliente-paciente-picker, print CSS (patrón reportes inventario).

---

## Roles

Misma matriz que 032 (finanzas + clientes).

---

## Backend

- [ ] Cloud Function: no  
- [ ] Reglas RTDB: no (ya en 032)  
- [ ] Email: no  

---

## Testing mínimo

QA guide + `npm run build` + smoke `:4200` — ver `tasks.md`.

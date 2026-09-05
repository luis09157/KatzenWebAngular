# Spec: Fase 3 — Caja y finanzas automáticas

**ID:** 071-fase3-caja-automatica  
**Estado:** done  
**Fecha:** 2026-09-04  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  
**Nivel:** L3 (nodo RTDB aditivo `Katzen/Caja/Turnos` + rules + UI)  
**Relaciona:** PLAN-UX Fase 3 · **064** corte · **065** ticket WhatsApp · **069** cambio en efectivo · **032** CxC

---

## Problema

El cobro no abre turno de caja. Nadie avisa que falta el corte. El ticket se imprime en A4 sin folio ni desglose de 80 mm. Finanzas no muestra ventas por veterinaria ni un atajo a CxC. El botón «Exportar» de órdenes de compra solo dice «Próximamente».

---

## User stories

### US-1 — Turno de caja (3.1)

Como **cajero / recepción**  
Quiero que el primer cobro del día abra el turno  
Para no pedir «apertura de caja» en un menú aparte

**Criterios de aceptación:**

- [x] SC-001: Primer ingreso del día crea `Katzen/Caja/Turnos/{YYYY-MM-DD}` con `abiertaEn` y `fondoInicial` (último corte o 0). Sin diálogo.
- [x] SC-002: Si ya hay corte activo de esa fecha, no se guarda un segundo corte. Copy claro en el diálogo.

### US-2 — Banner «Hacer corte» (3.2)

Como **cajero**  
Quiero un aviso en POS y en Hoy al final del día  
Para cerrar caja en &lt;2 minutos con solo el efectivo contado

**Criterios de aceptación:**

- [x] SC-003: Banner/CTA en `/admin/visitas` y dashboard Hoy si hay turno abierto y (hora local ≥ 18:00 **o** hubo ventas y no hay corte de hoy). Abre `caja-corte-dialog`.
- [x] SC-004: El campo principal del corte es **efectivo contado**. Esperado/diferencia siguen calculándose con `calcularCorteCaja`.

### US-3 — Ticket 80 mm (3.3)

Como **cajero**  
Quiero un ticket térmico 80 mm con folio y el mismo desglose que WhatsApp  
Para entregar o reenviar el comprobante sin romper el envío `wa.me` (065)

**Criterios de aceptación:**

- [x] SC-005: Al cobrar se persiste `folio?` aditivo en la visita (`KV-YYYYMMDD-NNN`). Print con clase `ticket-80` (ancho ~80 mm / 72 mm útil): clínica, folio, líneas, IVA si aplica, método(s), cambio si 1.7 lo calculó.
- [x] SC-006: WhatsApp usa el mismo folio y desglose. No se rompe `pos-ticket-whatsapp.util`.

### US-4 — Finanzas hoy (3.4)

Como **admin**  
Quiero ventas del día por veterinaria y un resumen de CxC  
Para no filtrar ni duplicar el módulo de clientes

**Criterios de aceptación:**

- [x] SC-007: Tab/sección «Ventas por veterinaria hoy» agrupa visitas del día por `atendidoPorNombre`.
- [x] SC-008: Bloque CxC con total y CTA a `/admin/clientes?deuda=1` (filtro existente; no se duplica el CRUD).

### US-5 — Exportar OC (3.5)

Como **admin de inventario**  
Quiero exportar las órdenes visibles a CSV  
Para dejar de ver «Próximamente»

**Criterios de aceptación:**

- [x] SC-009: El botón Exportar descarga CSV (folio, fecha, proveedor, estado, totales, ítems). Si no hay filas, aviso «Sin datos» (no Swal de próximamente).

---

## Fuera de alcance

- Deploy de `database` / hosting / functions (Luis autoriza).
- Menú 6 grupos, permisos por URL, config de clínica (Fase 4).
- Impresora térmica física en clínica (validación manual posterior).
- CFDI / PAC. Segundo turno el mismo día. App móvil (solo nodo aditivo).

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** nodo **nuevo y aditivo** `Katzen/Caja/Turnos/{fecha}`. Campo opcional `folio?` en `Katzen/Visitas/{id}`. No se eliminan ni renombran `Movimientos`, `Cortes` ni campos que consume la app móvil.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Caja/Turnos/{YYYY-MM-DD}` | staff | staff | `abiertaEn`, `fondoInicial`, `corteId?` |
  | `Katzen/Caja/Cortes` | staff | staff | sin cambio de forma; se rechaza 2.º corte en cliente |
  | `Katzen/Visitas/{id}` | staff / portal propio | staff | `folio?: string` opcional |
  | `Katzen/Inventario/OrdenesCompra` | staff | — (solo lectura para CSV) | sin cambio de contrato |

- **Estrategia de Datos de Prueba:** emulador RTDB (`environment.useRtdbEmulator`) o mocks. **Prohibido** `katzen-a0e3e` prod.

- **Patrones UI Reutilizados:** `admin-dialog-shell` (corte), `app-admin-page-banner` / banner compacto POS, `app-admin-data-panel` + `mat-table`, `LoadingService`, `ErrorMessagesService`, SweetAlert2 existente, `exportToCsv`.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (finanzas, corte, OC, POS) |
| doctor | POS + banner corte; finanzas según menú actual |
| recepcionista | POS + banner corte |

---

## UI (rutas y layout)

- `/admin/visitas` — banner corte + print `ticket-80`
- `/admin/inicio` (Hoy) — mismo banner
- `/admin/finanzas` — tab «Ventas hoy»
- `/admin/inventario/ordenes` — CSV
- `/admin/clientes?deuda=1` — filtro CxC existente

---

## Backend

- [x] Cloud Function: no
- [x] Reglas RTDB: sí — índice aditivo `Caja/Turnos`; write staff (hereda padre `Caja`)
- [x] Email / integración externa: no (WhatsApp sigue siendo `wa.me`)

---

## Testing mínimo

Ver `tasks.md` (utils turno/folio/ticket/corte duplicado/CSV + build + smoke emulador).

---

## Notas / decisiones

- Apertura **implícita** en el primer **ingreso** (`crearMovimiento`). Fondo = `efectivoContado` del último corte, o 0. Sin mini-diálogo (no fricción en cobro).
- Tras guardar corte se escribe `corteId` en el turno del día.
- Folio secuencial del día, no el UUID de la visita. WhatsApp prefiere `folio` y cae al folio corto del id (065).

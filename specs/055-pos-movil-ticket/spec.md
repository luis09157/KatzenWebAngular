# Spec: POS móvil — Ticket del día

**ID:** 055-pos-movil-ticket  
**Estado:** in_progress  
**Fecha:** 2026-08-28  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Relaciona:** 032 ticket, 039 cobro-integridad, 043 QR producto, 044 producto-picker, 045 hub POS, 046 walk-in, 050 cobro unificado, 054 wizard

---

## Problema

El Ticket del día se siente como un **formulario de ERP** (campos, UID staff, jerga «visita»). En mostrador y celular (375–430px) agregar un producto o un servicio es lento: hay que buscar, llenar cantidad y pulsar «Agregar línea». Recepción necesita un **punto de venta** como Square / Uber Eats / caja de OXXO: pulgar, catálogo táctil, carrito sticky y **COBRAR** imposible de perder.

El wizard dueño → líneas → cobrar (054) **se conserva y se viste de POS**. No se reabre «Registrar en caja» (050).

---

## Olas

| Ola | Entrega | Qué |
|-----|---------|-----|
| **1** | **Esta entrega** | UI móvil POS: 1 columna, búsqueda sticky, chips Productos / Servicios / Mostrador, lista táctil con «+» ≥44px, carrito sticky «N arts · $X · COBRAR», sheet de cantidad, cobro grande. Desktop puede ser 2 columnas. |
| **2** | Después | Scanner / código de barras: reutilizar `filtrarProductos` + QR de **043** (cámara o pegar código en la búsqueda sticky). |
| **3** | Después | Atajos de servicio a **1 tap** (baño, consulta, vacuna) con precio sugerido; hoy ola 1 pide monto si no hay precio. |

---

## User stories

### US-1 — Caja en el celular (ola 1)

Como **recepcionista en mostrador con el teléfono**  
Quiero **ver catálogo, pulsar + y cobrar sin pelearme con un formulario**  
Para **cerrar la venta en segundos**

**Criterios de aceptación:**

- [x] SC-001: Diálogo POS (`admin-dialog-shell`, sin `mat-dialog-title`) a pantalla completa o panel ancho en ≤720px.
- [x] SC-002: Una columna en 375–430px: búsqueda sticky arriba; chips **Productos | Servicios | Mostrador**.
- [x] SC-003: Lista/cards táctiles (no tabla densa) con botón **+** mínimo 44×44px.
- [x] SC-004: Carrito sticky abajo: `{n} arts · {total} · COBRAR`.
- [x] SC-005: Sheet inferior para detalle de línea (cantidad +/−, borrar).
- [x] SC-006: Wizard 3 pasos se mantiene (dueño → caja → cobrar); walk-in 1 tap con `CLIENTE_MOSTRADOR`.
- [x] SC-007: Badge «Descuenta inventario» en líneas producto; `VisitasService` / salidas / cobro-integridad sin cambios de contrato.
- [x] SC-008: Lista `/admin/visitas`: CTA **Nueva venta** (y atajo mostrador). Menú ⋮ móvil de la tabla se conserva.

### US-2 — Cobrar sin diálogo de ERP (ola 1)

Como **recepcionista**  
Quiero **métodos claros, monto y confirmar en el paso 3**  
Para **no abrir «Registrar movimiento» de finanzas**

**Criterios de aceptación:**

- [x] SC-009: Paso cobrar: efectivo / tarjeta / transferencia, monto (total o abono), botón **COBRAR** grande.
- [x] SC-010: El movimiento de caja sigue llevando `visitaId` (039/050). No reaparece «Registrar en caja» en módulos clínicos.

### US-3 — Scanner (ola 2 — no implementar ahora)

Como **recepcionista**  
Quiero **pegar o escanear el código / QR del producto**  
Para **agregarlo sin escribir el nombre**

**Criterios de aceptación:**

- [ ] SC-011: Búsqueda sticky acepta código exacto (ya lo hace `filtrarProductos`; ola 2: cámara / 043).

### US-4 — Servicios 1 tap (ola 3 — no implementar ahora)

Como **recepcionista**  
Quiero **pulsar Consulta / Baño y que entre al carrito**  
Para **no teclear monto cada vez**

**Criterios de aceptación:**

- [ ] SC-012: Precios sugeridos de servicio (plantilla o default clínica). Ola 1: pide monto si no hay precio.

---

## Fuera de alcance

- Cambios RTDB o Cloud Functions
- Reabrir cobro directo en baños/citas/pensión (050)
- Scanner de cámara (ola 2)
- Precios default de servicios sin prompt (ola 3)
- App nativa; esto es el admin web en viewport celular
- Commit / `firebase deploy`

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno nuevo. Se reutilizan nodos existentes; campos de línea (`cantidad?`, `productoId?`) ya son opcionales (045).

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Visitas/{id}` | staff | staff | ticket; `esMostrador?`, `lineas[]` |
  | `Katzen/Inventario/Productos` | staff | no en esta UI | catálogo POS |
  | `Katzen/Inventario/Movimientos` | — | staff vía `InventarioService.registrarSalida` | al persistir producto |
  | `Katzen/Caja/Movimientos` | — | staff vía `CajaService.crearMovimiento` | `visitaId` obligatorio al cobrar |
  | `Katzen/Banios` | staff | no | pendientes de peluquería |
  | `Katzen/Cliente`, `Katzen/Mascota` | staff | no | picker dueño (029) |

- **Estrategia de Datos de Prueba:** mocks / localhost. Prohibido producción `katzen-a0e3e`. Tests `test:046` (walk-in), `test:039`/`test:040` (integridad).

- **Patrones UI Reutilizados:** `admin-dialog-shell`, `ADMIN_DIALOG_POS`, `app-cliente-paciente-picker`, `filtrarProductos` (044), `app-flow-hint`, `.estado-badge`, `LoadingService`, SweetAlert2, menú ⋮ existente en la lista.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (`visitas`) |
| doctor | sí |
| recepcionista | sí (usuario principal del POS) |
| peluquero | según `STAFF_MODULE_ACCESS` |

---

## UI (rutas y layout)

- Ruta admin: `/admin/visitas` (sin ruta nueva)
- Patrón: lista CRUD + **diálogo POS fullscreen en móvil**
- Desktop ≥721px: opcional 2 columnas (catálogo \| carrito); **prioridad 375–430px**
- KPIs de la lista: se conservan

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md`. `npm run build`, `npm run test:046`, smoke `:4200`.

---

## Notas / decisiones

- Copy: **Caja POS** / **Nueva venta** en UI; menú sigue «Ticket del día».
- Staff UID no se muestra; «Atendido por» va en «Más opciones».
- Ola 1 pide monto en servicios; ola 3 lo vuelve 1 tap.

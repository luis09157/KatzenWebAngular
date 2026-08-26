# Spec: Automatización costos + dashboard gráficas

**ID:** 022-automatizacion-costos-dashboard  
**Estado:** draft  
**Fecha:** 2026-08-26  
**Autor:** Agent (pedido Luis Alfonso Niño Martínez)  
**Extiende:** 014-finanzas-caja-mvp, 018-finanzas-csv-banio-caja, 021-costos-rentabilidad-clinica  
**Dominio:** #19, #20, #13 (medicamentos↔historial), #24 (dashboard KPIs)

---

## Problema

Hoy la clínica **ya puede** registrar cobros, egresos, plantillas de costo y un P&L día/mes (014/018/021), y **ya tiene** inventario completo (productos, salidas, proveedores, OC). Lo que falta es el **cableado**:

1. Una venta de croquetas o un medicamento usado en cirugía **no descuenta stock y ajusta caja en el mismo gesto**.
2. Los gastos cotidianos (publicidad, gasolina, proveedores, generales) existen a medias (`publicidad` / `operativo` / `otro`) pero no están tipificados ni guiados.
3. El tab Rentabilidad muestra números, **no gráficas** ni filtro por semana.
4. Crear más módulos admin solo por crear aumentaría ruido: Finanzas ni siquiera está en las cards del inicio admin.
5. (Gap baños) El cobro baño→caja no arrastra costo/plantilla de forma sistemática; defaults por tamaño de perro ayudarían **sin** inventar otra app.

Luis pide: **automatizar + organizar gastos + ejemplos de uso + CRUDs honestos + dashboard**, **ajustando lo existente** (no proliferar ventanas).

---

## Principios UX (obligatorios)

| Principio | Decisión |
|-----------|----------|
| Hubs | Reutilizar **`/admin/finanzas`** e **`/admin/inventario`** — no 8 módulos nuevos |
| Dashboard | **Pestaña/sección** en finanzas (extender «Rentabilidad») y/o KPIs enriquecidos en `/admin/inicio` — **no** otra app |
| Descubrimiento | Añadir tarjeta «Finanzas» en dashboard inicio + breadcrumb/menú si falta |
| Automatización | Disparadores en pantallas donde ya ocurre el trabajo (baños, salida inventario, historial) |
| Gastos | Unificar en **egresos de caja** con categorías tipificadas — sin módulo «Gastos» aparte |
| Lenguaje | Español latino claro para dueñas |

---

## Qué ya existe (baseline — no reinventar)

| Capacidad | Dónde | Estado |
|-----------|-------|--------|
| Caja ingreso/egreso + métodos + IVA | `/admin/finanzas` tab Caja | 014 done |
| Baño → «Registrar en caja» + `cajaMovimientoId` | `/admin/banios` | 018 done |
| Plantillas de costo (BOM ligero) | Finanzas tab Costos | 021 done |
| Categoría + margen en cobro | Diálogo caja | 021 done |
| P&L día/mes (KPIs texto) | Finanzas tab Rentabilidad | 021 done (**sin** gráficas) |
| Productos costo/venta/IVA | `/admin/inventario/productos` | 021 labels |
| Salida inventario (motivos incl. `venta_directa`) | `/admin/inventario/movimientos` | Existe; **no** abre caja |
| `historial_clinico_id` en movimiento | Modelo + `registrarSalida(..., historialId)` | Campo listo; **UI historial no lo dispara** |
| Proveedores + OC | Inventario | CRUD existente |
| Catálogo `Katzen/Medicamentos` | `/admin/medicamentos` | ≠ stock; **no fusionar** en 022 |
| Card Finanzas en `/admin/inicio` | `dashboard.component` | **Falta** hoy |
| Librería de charts | `package.json` | **Ninguna** |

---

## Mapa de automatizaciones

| # | Evento (negocio) | Efecto inventario | Efecto caja / finanzas | Pantalla donde ocurre |
|---|------------------|-------------------|------------------------|------------------------|
| A1 | Baño / corte cobrado (+ opcional tamaño→costo default) | Opcional: consumir ítems de plantilla | Ingreso (018) + `costoAsociado` / margen (021) | `/admin/banios` → Registrar en caja |
| A2 | **Venta de producto** (croquetas, etc.) | Salida `venta_directa` | Ingreso `categoria: venta_producto` | Inventario → Salida (o atajo «Venta rápida» en finanzas = mismo diálogo) |
| A3 | **Uso clínico / cirugía** | Salida + `historial_clinico_id` | No crea ingreso solo; al cobrar: costo = salidas ligadas o plantilla | Historial → «Consumir de inventario»; cobro en Caja |
| A4 | Cobro cirugía/consulta con plantilla | Opt-in: salidas por ítem producto | Ingreso + `plantillaCostoId` + margen | Diálogo caja |
| A5 | Publicidad / gasolina / proveedores / generales | Ninguno | Egreso tipificado | Finanzas → Egreso |
| A6 | Recibir orden de compra | Entrada stock (ya existe) | Opt-in egreso `proveedores` | Inventario → Órdenes |
| A7 | Merma / caducado | Movimiento `merma` (007) | Sin caja (no inflar «gastos») | Inventario → Salida merma |

**Regla anti-doble:** automatización **asistida** (checkbox / confirmación). Links cruzados (`cajaMovimientoId`, `movimientoInventarioIds`) para no cobrar ni descontar dos veces en silencio.

---

## User stories

### US-1 — Venta producto = stock + caja (Fase A)

Como **recepcionista / doctora**  
Quiero **al vender croquetas u otro producto**, restar inventario y registrar el cobro  
Para **no llevar dos cuadernos**

**Criterios:**

- [ ] SC-001: Salida `venta_directa` con opción «También registrar en caja» (default ON) → ingreso `venta_producto`
- [ ] SC-002: Monto sugerido = `precio_venta × cantidad`; editable; IVA según producto
- [ ] SC-003: Links cruzados opcionales (`movimientoInventarioIds` / `cajaMovimientoId`)
- [ ] SC-004: Stock insuficiente → bloquear (007); no crear caja huérfana

### US-2 — Baño + plantilla / costo (Fase A)

Como **peluquera / doctora**  
Quiero **al cobrar baño**, llevar costo (plantilla y/o default por tamaño) y opcionalmente descontar insumos  
Para **que el margen y el stock reflejen la realidad**

**Criterios:**

- [ ] SC-005: Baño→caja: checkbox «Descontar productos de la plantilla» (ítems `producto_inventario`)
- [ ] SC-006: Falla parcial de stock → no dejar caja sin avisar
- [ ] SC-007: Sin plantilla / sin checkbox → comportamiento actual 018/021
- [ ] SC-007b: Defaults configurables de costo (y precio sugerido opcional) por tamaño pequeño/mediano/grande; override al registrar baño; `precio_total` siempre por registro — **sin** módulo nuevo (panel en Finanzas)

### US-3 — Consumo desde historial / kit cirugía (Fase B)

Como **doctora**  
Quiero **registrar insumos usados en cirugía desde el historial**  
Para **descontar stock y alimentar el costo del cobro**

**Criterios:**

- [ ] SC-008: Historial → «Consumir inventario» (reusa salida; setea `historial_clinico_id`)
- [ ] SC-009: Consumos del historial visibles para sugerir `costoAsociado` al cobrar
- [ ] SC-010: Plantilla `cirugia` al cobrar + opt-in descuento stock
- [ ] SC-011: Producto `controlado` / `requiere_receta` → exigir historial

### US-4 — Gastos tipificados en egresos (Fase D)

Como **dueña**  
Quiero **registrar publicidad, gasolina, proveedores y gastos generales**  
Para **ver en qué se va el dinero** sin otro módulo

**Criterios:**

- [ ] SC-012: Extender categorías egreso: `publicidad` \| `proveedores` \| `gasolina` \| `operativo` (generales) \| `otro`
- [ ] SC-013: Mismo diálogo de caja; chips; CSV con categoría
- [ ] SC-014: **No** crear CRUD ni ruta `/admin/gastos`

### US-5 — Dashboard gráficas + filtros (Fase C)

Como **dueña**  
Quiero **gráficas de gastos, ventas/ingresos y ganancias** con filtro mes / semana (/ día)  
Para **decidir rápido si el negocio va bien**

**Criterios:**

- [ ] SC-015: Tab Rentabilidad: ingresos vs egresos; desglose egresos por categoría; margen/neto en el tiempo
- [ ] SC-016: Filtros **día** \| **semana** \| **mes** (semana documentada: lun–dom local clínica)
- [ ] SC-017: Chart ligero alineado al design system (sin tema purple genérico)
- [ ] SC-018: Datos desde `Katzen/Caja/Movimientos` activos; sin categoría → «Sin categoría»
- [ ] SC-019: Opcional: mini KPIs en `/admin/inicio` — sin nuevo `StaffModule`

### US-6 — Descubrimiento hub finanzas

- [ ] SC-020: Card «Finanzas / caja» en `dashboard.component` `allModules`
- [ ] SC-021: Breadcrumb/label `finanzas` (hoy incompleto en layout)

---

## CRUD: ¿nuevo, extender, o no crear?

| Entidad / pantalla | Decisión | Motivo |
|--------------------|---------|--------|
| Movimientos de caja | **Extender** | Hub de dinero; categorías + links inventario |
| Plantillas de costo | **Extender** | BOM 021; «aplicar → stock» |
| Defaults baño por tamaño | **Extender / mini-CRUD** | 3 filas en Finanzas; **no** módulo aparte |
| Productos inventario | **No crear** | Ya existen |
| Movimientos inventario | **Extender** | Wire venta→caja; UI historial |
| Proveedores | **No crear** | CRUD existe; pago = egreso |
| Órdenes de compra | **Extender leve** | Opt-in egreso al recibir (Fase E) |
| Alertas / reportes inv. | **No crear** | Ya existen |
| Módulo «Gastos» | **No crear** | Egresos tipificados |
| Módulo «Ventas» / POS | **No crear** | Salida + caja |
| Módulo «Dashboard finanzas» | **No crear** | Tab Rentabilidad |
| Módulo «Pensión / alojamiento» | **No crear en 022** | Fuera; si Luis lo pide → spec aparte |
| Dashboard KPIs global (#24) | **Parcial** | Solo mini KPIs inicio si cabe |
| Catálogo Medicamentos | **No fusionar** | Consumo vía Inventario/Productos |
| Nodo legacy `Katzen/Venta` | **No integrar** | Fuera |
| CFDI | **No crear** | Fuera |
| CRUD editable «categorías gasto» | **No crear** | Enum + labels |

---

## Ejemplos de negocio (cotidianos Katzen)

1. **Venta de croquetas** — Salida «Venta directa» → confirma caja. Stock −1; ingreso «Venta producto».
2. **Baño completo** — Tamaño mediano → costo default; override si aplica; «Registrar en caja» + plantilla + opt-in descontar shampoo.
3. **Cirugía de esterilización** — Consumos desde historial; al cobrar, costo sugerido desde salidas o plantilla.
4. **Publicidad Facebook** — Egreso categoría Publicidad $500.
5. **Gasolina camioneta clínica** — Egreso Gasolina; no toca inventario.
6. **Pago proveedor alimentos** — Tras recibir OC, opt-in egreso Proveedores (o egreso manual).
7. **Consulta + vacuna** — Vacuna como producto inventario; consumo/salida; cobro en caja con margen.
8. **Merma por caducidad** — Merma 007; **no** genera movimiento de caja.

---

## Fuera de alcance

- Facturación electrónica **SAT CFDI**
- **Resend** / correos portal (diferido — decisión Luis)
- Nómina, conciliación bancaria, pasarela de pagos
- Integración nodo legacy `Katzen/Venta`
- COGS FIFO / costo promedio ponderado formal
- Multi-sucursal / P&L por sucursal
- Dashboard KPIs centralizado completo (#24)
- Módulo pensión/alojamiento (spec futura si Luis prioriza)
- Cambios destructivos RTDB / app móvil
- Fusionar `Katzen/Medicamentos` con `Inventario/Productos`

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB (aditivo):**

  | Nodo / campo | Lectura | Escritura | Notas |
  |--------------|---------|-----------|-------|
  | `Katzen/Caja/Movimientos.*.categoria` | staff | staff | Extender egreso (`proveedores`, `gasolina`) |
  | `Katzen/Caja/Movimientos.*.movimientoInventarioIds?` | staff | staff | **nuevo opcional** |
  | `Katzen/Caja/Movimientos.*.ordenCompraId?` | staff | staff | Fase E |
  | `Katzen/Inventario/Movimientos.*.cajaMovimientoId?` | staff | staff | **nuevo opcional** |
  | `Katzen/Inventario/Movimientos.historial_clinico_id` | staff | staff | ya existe; activar UI |
  | `Katzen/Banios.*.cajaMovimientoId` | staff | staff | ya 018 |
  | `Katzen/Banios.*.tamano_perro?` / `costoEstimado?` / `plantillaCostoId?` | staff | staff | opcionales (sub A baños) |
  | `Katzen/Finanzas/DefaultsBanioPorTamano` | staff | staff | **nuevo** mini-nodo 3 tamaños |
  | `Katzen/Finanzas/PlantillasCosto` | staff | staff | sin breaking |

- **App móvil:** no consume Caja/Finanzas; Banios campos opcionales OK; Inventario aditivo.
- **Pruebas:** mocks locales + Cypress. **Nunca** producción.
- **UI:** tabs finanzas; `admin-dialog-shell`; loading contextual; «Borrar»; política 011.

---

## Roles

Política 011: `finanzas` + `inventario` + `banios` + `historiales` = staff operativo.

---

## UI (rutas)

| Ruta | Cambio |
|------|--------|
| `/admin/finanzas` | Extender; gráficas; egresos tipificados; opcional panel defaults baño |
| `/admin/inventario/movimientos` | Wire venta→caja |
| `/admin/banios` | Costo/tamaño/plantilla al cobrar; opt-in stock |
| `/admin/historiales` | Consumir inventario |
| `/admin/inicio` | Card Finanzas (+ mini KPIs opcionales) |
| `/admin/gastos`, `/admin/ventas`, `/admin/dashboard-finanzas`, `/admin/pension` | **No crear** |

Sin nuevo `StaffModule`.

---

## Backend

- Transacciones cliente RTDB (patrón inventario) para stock + links.
- Cloud Functions: no en MVP salvo races graves.
- Reglas: campos opcionales; índices si filtra por categoría.

---

## Fases

| Fase | Nombre | Entrega clave |
|------|--------|---------------|
| **A** | Wire baño/salida → caja + stock (+ defaults tamaño baño) | SC-001…007b, SC-020 |
| **B** | Kit / consumo historial | SC-008…011 |
| **C** | Dashboard gráficas + filtros | SC-015…019, SC-021 |
| **D** | Gastos tipificados | SC-012…014 |
| **E** (opcional) | OC → egreso opt-in | A6 |

Orden: **A → D**; **C** puede ir en paralelo tras datos de caja útiles; **B** tras A.

---

## Notas / decisiones

1. **021 es base** — enriquecer, no rehacer.
2. Automatización **asistida**, no mágica silenciosa.
3. `operativo` = «Gastos generales» en UI.
4. Defaults baño por tamaño = **atajo de costo**; coexisten con plantillas 021.
5. **No** abrir módulo pensión ni «tipos de servicio» genéricos en 022 (evitar proliferación).
6. Esta carpeta en draft = **solo planificación** hasta que Luis apruebe implementación por fase.

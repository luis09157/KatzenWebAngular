# Spec: Automatización costos + ops financieras (hub)

**ID:** 022-automatizacion-costos-dashboard  
**Estado:** in-progress  
**Fecha:** 2026-08-26  
**Autor:** Agent (pedido Luis Alfonso Niño Martínez)  
**Extiende:** 014-finanzas-caja-mvp, 018-finanzas-csv-banio-caja, 021-costos-rentabilidad-clinica  
**Dominio:** #19, #20, #13 (medicamentos↔historial), #24 (dashboard KPIs)

---

## Problema

Hoy la clínica **ya puede** registrar cobros, egresos, plantillas de costo y un P&L día/mes (014/018/021), y **ya tiene** inventario completo (productos, salidas, proveedores, OC). Lo que falta es el **cableado** y la **visión financiera del stock**:

1. No se ve cuánto dinero está **invertido** en inventario, cuánto **valdría a precio de venta**, ni la **ganancia potencial**.
2. Una venta de croquetas o un medicamento usado en cirugía **no descuenta stock y ajusta caja en el mismo gesto**.
3. Baños: cobro→caja existe (018) pero **defaults por tamaño** y costo/margen no están sistemáticos.
4. Cirugías / vacunas / servicios clínicos no consumen inventario de forma guiada desde historial.
5. **Alojamiento / pensión** no existe como módulo (hospedaje de mascotas).
6. Crear módulos solo por crear aumenta ruido; el hub debe ser **Finanzas + Inventario + eventos**.

Luis pide: **automatizar + métricas inventario + baños + pensión (diseño) + cirugías/vacunas + extensibilidad + CRUDs honestos**, **ajustando lo existente**.

---

## Principios UX (obligatorios)

| Principio | Decisión |
|-----------|----------|
| Hubs | Reutilizar **`/admin/finanzas`** e **`/admin/inventario`** — no 8 módulos nuevos |
| Excepción | **Pensión/alojamiento** = módulo nuevo justificado (servicio operativo diario con CRUD propio) |
| Dashboard | Tab Rentabilidad + KPIs inventario/finanzas — **no** otra app |
| Descubrimiento | Tarjeta «Finanzas» en `/admin/inicio` + menú |
| Automatización | Disparadores donde ocurre el trabajo (baños, salida inv., historial, pensión) |
| Gastos | Egresos tipificados — sin módulo «Gastos» aparte |
| Extensibilidad | Catálogo de **tipos de servicio** + eventos → «movimientos económicos»; no N pantallas por tipo |
| Lenguaje | Español latino claro |

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
| KPI «Valor inventario» | Dashboard inventario | Solo `stock × precio_compra` — **falta** venta + margen potencial |
| Salida inventario (motivos incl. `venta_directa`) | `/admin/inventario/movimientos` | Existe; **no** abre caja |
| `historial_clinico_id` en movimiento | Modelo + service | Campo listo; **UI historial no lo dispara** |
| Proveedores + OC | Inventario | CRUD existente |
| Card Finanzas en `/admin/inicio` | `dashboard.component` | **Falta** |
| Pensión / alojamiento | `/admin/pension` | **Scaffold MVP (B1) en A** — lista/alta/caja; defaults tamaño + comida = B |
| Librería de charts | `package.json` | **Ninguna** |

---

## Inventario financiero en métricas (US-INV)

Como **dueña / doctora**  
Quiero ver en KPIs de inventario (y/o finanzas)  
**cuánto invertí**, **cuánto valdría a precio de venta** y **ganancia potencial**  
Para **saber el capital inmovilizado** sin Excel.

**Fórmulas (activo, `stock_actual > 0`):**

| Métrica | Fórmula | Label UI sugerido |
|---------|---------|-------------------|
| Invertido (costo) | `Σ (stock_actual × precio_compra)` | «Invertido (costo)» |
| Valor a venta | `Σ (stock_actual × precio_venta)` | «Valor a precio venta» |
| Ganancia potencial | valor venta − invertido | «Margen potencial stock» |

**Criterios:**

- [ ] SC-INV-001: Tres KPIs visibles en `/admin/inventario` (dashboard) — reutilizar `app-admin-kpi-grid`
- [ ] SC-INV-002: Hint/tooltip aclara «valuación a costo» vs «a precio de venta» (no COGS FIFO)
- [ ] SC-INV-003: Sin módulo nuevo; opcional eco en tab Rentabilidad finanzas (resumen stock)
- [ ] SC-INV-004: Solo productos `activo`; stock ≤ 0 no suma

---

## Mapa de automatizaciones

| # | Evento (negocio) | Efecto inventario | Efecto caja / finanzas | Pantalla | Fase |
|---|------------------|-------------------|------------------------|----------|------|
| A0 | Ver valuación stock | — (lectura) | KPIs invertido / venta / margen potencial | Inventario dashboard | **A** |
| A1 | Baño / corte cobrado (+ tamaño→costo default) | Opt-in plantilla (post-A) | Ingreso + `costoAsociado` / margen | `/admin/banios` | **A** |
| A2 | Venta de producto | Salida `venta_directa` | Ingreso `venta_producto` | Inventario → Salida | **A** |
| A3 | Uso clínico / cirugía / vacuna | Salida + `historial_clinico_id` | Costo al cobrar | Historial | **B** |
| A4 | Cobro cirugía/consulta con plantilla | Opt-in salidas | Ingreso + plantilla + margen | Diálogo caja | **B** |
| A5 | Estancia pensión cobrada | Opt-in comida/insumos | Ingreso `pension` | `/admin/pension` | **B** |
| A6 | Publicidad / gasolina / proveedores | Ninguno | Egreso tipificado | Finanzas → Egreso | **D** |
| A7 | Recibir OC | Entrada stock | Opt-in egreso `proveedores` | Órdenes | **E** |
| A8 | Merma / caducado | `merma` | Sin caja | Inventario | (007) |

**Regla anti-doble:** automatización **asistida** (checkbox / confirmación). Links cruzados (`cajaMovimientoId`, `movimientoInventarioIds`).

---

## User stories

### US-1 — Valuación inventario (Fase A)

Ver SC-INV-* arriba.

### US-2 — Venta producto = stock + caja (Fase A)

Como **recepcionista / doctora**  
Quiero al vender croquetas restar inventario y registrar el cobro  
Para no llevar dos cuadernos.

**Criterios:**

- [ ] SC-001: Salida `venta_directa` + opción «También registrar en caja» (default ON) → ingreso `venta_producto`
- [ ] SC-002: Monto sugerido = `precio_venta × cantidad`; editable; IVA según producto
- [ ] SC-003: Links cruzados opcionales
- [ ] SC-004: Stock insuficiente → bloquear; no caja huérfana

### US-3 — Baño + defaults tamaño + caja (Fase A)

Como **peluquera / doctora**  
Quiero defaults de costo/precio por tamaño (P/M/G), override al registrar, y cobro en caja con margen  
Para que el P&L refleje baños reales.

**Criterios:**

- [ ] SC-005: Config 3 tamaños en Finanzas (o panel baños) — **no** módulo nuevo
- [ ] SC-006: Alta baño: `tamano_perro` → prefill `costoEstimado` / `precio_total` sugerido; **override** siempre
- [ ] SC-007: `precio_total` siempre por registro (variable)
- [ ] SC-008: «Registrar en caja» arrastra monto, categoría, `costoAsociado`, `plantillaCostoId?`
- [ ] SC-009: Campos Banio **aditivos** (móvil OK)
- [ ] SC-010: Card «Finanzas» en inicio admin

### US-4 — Cirugías, vacunas, servicios clínicos (Fase B)

Como **doctora**  
Quiero registrar insumos usados en cirugía/vacuna desde historial  
Para descontar stock y alimentar costo del cobro.

**Criterios:**

- [ ] SC-011: Historial → «Consumir inventario» (`historial_clinico_id`)
- [ ] SC-012: Consumos visibles → sugerir `costoAsociado` al cobrar
- [ ] SC-013: Plantilla `cirugia` / vacuna al cobrar + opt-in stock
- [ ] SC-014: Producto `controlado` / `requiere_receta` → exigir historial

### US-5 — Alojamiento / pensión (módulo nuevo — diseño Fase A docs; código Fase B)

Como **recepcionista / doctora**  
Quiero registrar hospedaje de mascotas (entrada/salida, días, tamaño, precio/día, costo)  
Y cobrar en caja  
Para no usar Excel ni baños como proxy.

**Criterios (diseño ahora; implementación Fase B):**

- [ ] SC-015: Spec + plan: nodo `Katzen/Pension/Estancias`, precios/costos por día/tamaño
- [ ] SC-016: CRUD lista + alta + editar + «Borrar» (baja lógica)
- [ ] SC-017: StaffModule `pension` + ruta `/admin/pension` + menú + card inicio
- [ ] SC-018: Cobro → caja categoría `pension` + `costoAsociado`
- [ ] SC-019: Opt-in consumo comida inventario (plantilla o ítems)
- [ ] SC-020: **No** mezclar con Banios

### US-6 — Dashboard gráficas (Fase C)

- [ ] SC-021: Gráficas ingresos vs egresos; desglose egresos; margen en el tiempo
- [ ] SC-022: Filtros día \| semana \| mes
- [ ] SC-023: Chart ligero / design system

### US-7 — Gastos tipificados (Fase D)

- [ ] SC-024: Categorías egreso: `publicidad` \| `proveedores` \| `gasolina` \| `operativo` \| `otro`
- [ ] SC-025: **No** crear `/admin/gastos`

---

## Extensibilidad / crecimiento

**Principio:** un hub **Finanzas** + **Inventario** + eventos de dominio que emiten **movimientos económicos** (caja ± opcional stock).

```text
[TipoServicioCatálogo]  banio | corte | cirugia | vacuna | consulta | pension | venta_producto | futuro…
         │
         ▼
[Evento operativo]  Banio | Historial | EstanciaPension | SalidaInv | …
         │
         ├─► MovimientoInventario? (consumo / venta)
         └─► MovimientoCaja? (cobro / egreso)  + plantillaCostoId? + costoAsociado?
```

| Cómo agregar un tipo nuevo | Qué hacer | Qué **no** hacer |
|----------------------------|-----------|------------------|
| Nuevo cobro (ej. «hotel gatos VIP») | Extender enum `categoria` caja + label; plantilla 021; evento en pantalla existente o módulo si es CRUD operativo | Crear `/admin/dashboard-vip` |
| Nuevo servicio con agenda/lista | Spec + módulo solo si hay lifecycle propio (como pensión) | Duplicar tabs finanzas |
| Nuevo gasto | Chip/categoría egreso | Módulo Gastos |
| Nuevo consumo clínico | Salida + historialId + plantilla | Duplicar inventario |

`PlantillaTipoServicio` y `CajaCategoria` crecen juntos; UI de cobro es **una**.

---

## CRUD mapa completo

| Entidad | Pantalla | C | R | U | Borrar* | Impactos |
|---------|----------|---|---|---|---------|----------|
| Movimiento caja | `/admin/finanzas` (existente) | ✓ | ✓ | — | ✓ baja | P&L, CSV |
| Plantilla costo | Finanzas tab Costos (existente) | ✓ | ✓ | ✓ | ✓ | Margen cobro, futuro stock |
| Defaults baño P/M/G | Finanzas panel (extender) | ✓ | ✓ | ✓ | — (editar) | Prefill baño→caja |
| Producto inventario | Inventario productos (existente) | ✓ | ✓ | ✓ | ✓ | KPIs valuación, salidas |
| Movimiento inventario | Inventario movimientos (existente) | ✓ | ✓ | — | — | Stock; wire caja Fase A |
| Proveedor | Inventario (existente) | ✓ | ✓ | ✓ | ✓ | OC |
| Orden compra | Inventario (existente) | ✓ | ✓ | ✓ | ✓ | Stock; egreso opt-in E |
| Baño | `/admin/banios` (existente) | ✓ | ✓ | ✓ | ✓ | Caja 018/022; tamaño/costo A |
| Historial clínico | `/admin/historiales` (existente) | ✓ | ✓ | ✓ | ✓ | Consumo inv. Fase B |
| Vacuna (catálogo aplicación) | `/admin/vacunas` (existente) | ✓ | ✓ | ✓ | ✓ | Link clínico B (no duplicar stock) |
| Estancia pensión | `/admin/pension` (**nueva** Fase B) | ✓ | ✓ | ✓ | ✓ | Caja + opt-in comida |
| Defaults pensión tamaño | Finanzas o config pensión B | ✓ | ✓ | ✓ | — | Prefill precio/día |
| Módulo «Gastos» | — | — | — | — | — | **No crear** |
| Módulo «Ventas» / POS | — | — | — | — | — | **No crear** |
| Dashboard finanzas aparte | — | — | — | — | — | **No crear** (tab) |

\*Borrar = baja lógica `activo: false` en UI («Borrar»).

---

## Ejemplos de negocio

1. **Valuación stock** — Dueña abre Inventario: «Invertido $45,000 · Valor venta $72,000 · Margen potencial $27,000».
2. **Venta croquetas** — Salida venta directa → confirma caja. Stock −1; ingreso venta producto.
3. **Baño mediano** — Elige tamaño → costo/precio sugeridos → override precio → Registrar en caja → margen en Rentabilidad.
4. **Cirugía esterilización** — Consumos desde historial; al cobrar, costo = salidas o plantilla.
5. **Vacuna** — Producto inventario consumido + cobro consulta/vacuna.
6. **Pensión 3 días perro grande** — Alta estancia; checkout → ingreso pensión × días; opt-in comida.
7. **Publicidad Facebook** — Egreso Publicidad $500.
8. **Gasolina** — Egreso Gasolina; sin inventario.
9. **Pago proveedor** — Tras OC, egreso Proveedores.
10. **Merma caducidad** — Merma 007; **sin** caja.

---

## Fases A → D (orden de implementación)

| Fase | Nombre | Entrega clave | SC |
|------|--------|---------------|-----|
| **A** | KPIs valuación + baño defaults/caja + card Finanzas + venta→caja + **scaffold pensión** | SC-INV, SC-005…010, SC-001…004 + pensión B1 | Ahora |
| **B** | Consumo historial/cirugía/vacuna + completar pensión (defaults tamaño, comida) | SC-011…020 | Tras A |
| **C** | Gráficas Rentabilidad + filtros | SC-021…023 | Tras datos útiles |
| **D** | Egresos tipificados | SC-024…025 | Puede paralelo C |
| **E** | OC → egreso opt-in | A7 | Opcional |

**Pensión:** diseño completo en esta spec; **scaffold MVP (lista/alta/precio/caja + rules)** adelantado en Fase A por autorización Luis (2026-08-26). Defaults pensión por tamaño y consumo comida = resto de B.

---

## Fuera de alcance

- CFDI / SAT  
- Resend (diferido)  
- Nómina, bancos, pasarelas  
- Nodo legacy `Katzen/Venta`  
- COGS FIFO formal  
- Multi-sucursal  
- Fusionar `Medicamentos` ↔ `Inventario/Productos`  
- Cambios destructivos RTDB / móvil  

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB (aditivo):**

  | Nodo / campo | Lectura | Escritura | Notas |
  |--------------|---------|-----------|-------|
  | Productos (lectura agregada) | staff | — | KPIs valuación client-side |
  | `Caja/Movimientos.*.categoria` | staff | staff | + `pension` en B; egresos D |
  | `Caja/Movimientos.*.movimientoInventarioIds?` | staff | staff | A venta |
  | `Inventario/Movimientos.*.cajaMovimientoId?` | staff | staff | A |
  | `Banios.tamano_perro?`, `costoEstimado?`, `plantillaCostoId?` | staff | staff | A aditivo |
  | `Finanzas/DefaultsBanioPorTamano` | staff | staff | A nuevo |
  | `Pension/Estancias/{id}` | staff | staff | **B** nuevo |
  | `Finanzas/DefaultsPensionPorTamano` | staff | staff | B |
  | `Finanzas/PlantillasCosto` | staff | staff | sin breaking |

- **App móvil:** no consume Caja/Finanzas/Pension; Banios opcionales OK.
- **Pruebas:** mocks + Cypress. **Nunca** producción.
- **UI:** admin pattern; loading contextual; «Borrar»; design system.

---

## Roles

Política 011: `finanzas` + `inventario` + `banios` + `historiales` + (B) `pension` = staff operativo.

---

## UI (rutas)

| Ruta | Cambio | Fase |
|------|--------|------|
| `/admin/inventario` | KPIs valuación triple | A |
| `/admin/finanzas` | Panel defaults baño; (+ pension defaults B) | A/B |
| `/admin/banios` | Tamaño/costo/precio; caja con costo | A |
| `/admin/inventario/movimientos` | Wire venta→caja | A |
| `/admin/inicio` | Card Finanzas (+ Pension B) | A/B |
| `/admin/historiales` | Consumir inventario | B |
| `/admin/pension` | **Nuevo** módulo | B |
| `/admin/gastos`, `/admin/ventas` | **No crear** | — |

---

## Backend

- Transacciones cliente RTDB (patrón inventario).
- CF: no en MVP salvo races.
- Reglas: `Katzen/Pension` staff R/W en B; Finanzas ya 021.

---

## Notas / decisiones

1. **021 es base** — enriquecer, no rehacer.
2. Automatización **asistida**.
3. Defaults tamaño = atajo de costo; plantilla gana si se elige; override manual gana al guardar.
4. KPI inventario actual «Valor inventario» = costo; **renombrar/clarificar** al añadir venta + margen.
5. Pensión es el **único** módulo nuevo justificado en 022; resto = hubs existentes.

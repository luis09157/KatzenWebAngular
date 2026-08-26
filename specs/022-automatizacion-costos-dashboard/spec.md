# Spec: Automatización costos / dashboard + baños por tamaño

**ID:** 022-automatizacion-costos-dashboard  
**Estado:** draft  
**Fecha:** 2026-08-26  
**Autor:** Agent (Luis Alfonso Niño Martínez)  
**Extiende:** 014-finanzas-caja-mvp, 018-finanzas-csv-banio-caja, 021-costos-rentabilidad-clinica  
**Dominio:** #19, #20 (baños → caja / costos / P&L)

---

## Problema

021 entregó plantillas de costo, categoría/margen en caja y P&L día/mes, pero el registro de **baños** sigue desconectado del costo real:

1. No hay **defaults de costo por tamaño de perro** (pequeño / mediano / grande).
2. El **precio cobrado** varía mucho por registro; no debe forzarse un precio fijo rígido (sí puede sugerirse).
3. El enlace baño→caja (018) abre el diálogo prellenado, pero **no arrastra** automáticamente costo asociado / plantilla / tamaño.
4. Descuento de inventario al usar plantilla queda como fase futura (021); hay que **planear** el enlace sin implementarlo aún.

Las dueñas necesitan: configurar costos una vez por tamaño, ajustar al registrar el baño, capturar precio cada vez, y que eso alimente finanzas (caja + costos + margen + dashboard).

---

## Análisis: modelo actual Banios ↔ Finanzas

| Capa | Hoy (repo) | Gap para 022 |
|------|------------|--------------|
| `Katzen/Banios` | `precio_base`, `precio_total`, `pagado`, `cajaMovimientoId?`, `tipo_servicio`, productos/servicios adicionales | Sin `tamano_perro`; sin `costoAsociado` / `plantillaCostoId` en el baño; precio_base no se deriva de catálogo por tamaño |
| `TiposServiciosPeluqueria` / `ProductosPeluqueria` | Catálogo operativo peluquería (precio_base tipo servicio) | No modela costo por tamaño; no es inventario clínico |
| Caja 014/018 | Ingreso con `banioId`, link `cajaMovimientoId` | Manual «Registrar en caja»; no auto-costo |
| Plantillas 021 | `PlantillasCosto` por tipoServicio + ítems | No hay defaults por tamaño; baño no sugiere plantilla al alta |
| Rentabilidad 021 | KPIs día/mes desde movimientos | Solo refleja costos si el cobro trajo `costoAsociado` |

**Conclusión:** 022 automatiza el puente Banio → costo (por tamaño) → caja/margen → dashboard, con config de defaults y override al registrar. UI de config + automatización se **fasan** (ver plan).

---

## Baños: defaults por tamaño + precio por registro + enlace finanzas

### Reglas de negocio (obligatorias)

1. Al agregar un **nuevo baño**, deben existir **defaults configurables de costo** por tamaño: **pequeño / mediano / grande**.
2. Esos defaults se editan en **configuración** (catálogo, una sola vez), **y** son **ajustables al momento** de registrar el baño.
3. El **precio total del baño** se captura **cada vez** (varía mucho). No forzar precio fijo rígido; sí puede sugerirse default de precio si existe en catálogo.
4. Todo **impacta finanzas** y debe quedar **enlazado**: registrar baño → (ideal) movimiento caja + costos asociados + (futuro) descuento inventario si usa plantilla.

### Tabla de campos

| Campo | Default configurable (catálogo) | Override al registrar | Efecto finanzas / inventario |
|-------|----------------------------------|------------------------|------------------------------|
| `tamano_perro` (`pequeno` \| `mediano` \| `grande`) | — (elegido por registro; puede sugerirse desde mascota si algún día hay dato) | Obligatorio al alta de baño | Selecciona fila de defaults; no es monto |
| `costoEstimado` / costo asociado del servicio | Sí — monto (o desglose) por tamaño en config | Sí — editable en diálogo baño | Al ir a caja → `costoAsociado`; alimenta margen y P&L 021 |
| `precioSugerido` (opcional) | Sí — precio sugerido por tamaño (si la clínica lo define) | No fuerza; solo prellena | Sugerencia UI; no cierra caja sola |
| `precio_total` (cobro al cliente) | Opcional sugerencia desde `precioSugerido` | **Sí — obligatorio por registro** (campo libre cada vez) | Al registrar en caja → `monto` del ingreso; margen = monto − costo |
| `precio_base` (legacy Banio) | Puede alinearse al sugerido o al costo+margen clínica | Editable | Compatibilidad móvil/legacy; no reemplaza `precio_total` |
| `plantillaCostoId` | Default opcional por tamaño o por `tipo_servicio` | Sí — elegir otra / ninguna | Stamp en baño y en movimiento caja; futuro BOM inventario |
| `cajaMovimientoId` | — | Flujo «Registrar en caja» (018) o auto-sugerido Fase A | Enlace Banio ↔ Movimiento; evita doble cobro |
| Ítems plantilla (productos inventario) | En plantilla 021 | Cantidades/override futuro | **Fase futura:** salida inventario al completar / cobrar; no MVP UI 022 sin plan aparte |

### User stories

### US-1 — Defaults de costo por tamaño (config)

Como **doctora / admin**  
Quiero **definir costo default** (y opcionalmente precio sugerido) para baño **pequeño / mediano / grande**  
Para **no reinventar números en cada registro**

**Criterios:**

- [ ] SC-001: Catálogo editable (Finanzas o Config baños) con 3 filas de tamaño
- [ ] SC-002: Cada fila: `costoDefault` obligatorio ≥ 0; `precioSugerido` opcional
- [ ] SC-003: Persistencia aditiva RTDB; lectura con defaults seguros si falta nodo

### US-2 — Registro de baño con override

Como **recepcionista / peluquero**  
Quiero **al crear un baño** elegir tamaño, ver costo/precio sugeridos y **ajustarlos** + capturar **precio total real**  
Para **cobrar lo justo sin perder el costo estimado**

**Criterios:**

- [ ] SC-004: Campo tamaño en diálogo baño (nuevo / edición)
- [ ] SC-005: Al elegir tamaño → prellenar costo (y precio sugerido si existe); ambos editables
- [ ] SC-006: `precio_total` siempre editable por registro; no bloqueado a un fijo de catálogo
- [ ] SC-007: Persistir en Banio campos aditivos de costo/tamaño/plantilla (sin romper legacy)

### US-3 — Enlace automático a finanzas

Como **dueña**  
Quiero que al **registrar / cobrar** el baño se propague a caja con categoría, costo y margen  
Para **ver el baño en el dashboard de rentabilidad** sin captura doble

**Criterios:**

- [ ] SC-008: «Registrar en caja» prellena `monto` = `precio_total`, `categoria` banio|corte, `costoAsociado` desde baño, `plantillaCostoId` si hay
- [ ] SC-009: Ideal Fase A: opción de crear/vincular movimiento sin reescribir montos a mano (mismo diálogo 014, datos prellenados)
- [ ] SC-010: Cancelar baño / no pagado no inventa ingreso; respeta reglas 018 (no doble cobro)

### US-4 — Inventario futuro (planificado, no MVP UI)

Como **admin**  
Quiero que **si el baño usa plantilla con productos de inventario**, a futuro se descuente stock  
Para **cuadrar COGS real**

**Criterios:**

- [ ] SC-011: Documentado en plan: disparador (completar o cobrar), ítems plantilla → salida inventario; **fuera de alcance de implementación** hasta subtarea explícita
- [ ] SC-012: ProductosPeluqueria vs Inventario clínico: no mezclar nodos; plantilla 021 usa inventario clínico

---

## Fuera de alcance (esta spec — docs primero)

- Implementación UI **hasta** que el plan esté aprobado y se pida explícitamente implementar
- CFDI / SAT
- COGS FIFO / costo promedio ponderado
- Auto-descuento inventario (solo diseño en plan — Fase B)
- Cambiar nodos que consume la app móvil de forma no aditiva

---

## Alcance adicional 022 (automatización dashboard — no bloquear baños)

Además de baños por tamaño, el plan 022 agrupa (fases posteriores / opcionales):

| Tema | Fase sugerida | Notas |
|------|---------------|-------|
| Wire baño/venta → stock + caja | B+ | Tras defaults + enlace costo |
| Consumo inventario desde historial | C | Medicamentos controlados (backlog #13) |
| Egresos tipificados (gasolina / proveedores) | A/Config | Extender categorías egreso 021 |
| Gráficas en tab Rentabilidad | A+ | Sin módulo nuevo; enriquecer 021 |

**Prioridad Luis (2026-08-26):** baños defaults por tamaño + precio por registro + enlace finanzas **antes** que gráficas/egresos extra.
---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB (aditivo propuesto):**

  | Nodo / campo | Lectura | Escritura | Notas |
  |--------------|---------|-----------|-------|
  | `Katzen/Finanzas/DefaultsBanioPorTamano` (o bajo config) | staff | staff | **nuevo** — 3 keys o array por tamaño |
  | `Katzen/Banios.*.tamano_perro?` | staff | staff | opcional legacy-safe |
  | `Katzen/Banios.*.costoEstimado?` | staff | staff | opcional |
  | `Katzen/Banios.*.plantillaCostoId?` | staff | staff | opcional; espejo caja |
  | `Katzen/Caja/Movimientos` | — | — | reutilizar campos 021 (`costoAsociado`, etc.) |
  | `Katzen/Finanzas/PlantillasCosto` | — | — | sin breaking; posible link por tamaño |

- **App móvil:** cambios solo aditivos en `Banios`; móvil ignora campos desconocidos.
- **Pruebas:** mocks locales (`mock-data.ts`); nunca prod.
- **UI:** `admin-dialog-shell`, baños existente + tab/sección config en finanzas; política 011.

---

## Roles

Política 011: baños + finanzas = todo staff operativo.

---

## UI (rutas) — cuando se implemente

- `/admin/banios` — diálogo alta/edición con tamaño + overrides
- `/admin/finanzas` — sección o sub-tab **Defaults baño por tamaño** (config)
- Sin nuevo `StaffModule` obligatorio

---

## Backend

- Reglas RTDB: nodo defaults bajo `Finanzas` (ya staff R/W en 021) o extensión
- Sin Cloud Functions en MVP automatización
- Inventario automático = fase posterior (posible callable o transacción cliente)

---

## Notas / decisiones

1. **Precio ≠ costo:** precio lo captura el humano cada vez; costo tiene default por tamaño.
2. **021 queda done:** esta spec no reabre SC de 021; los extiende.
3. **Fases:** ver `plan.md` — **Fase A** = automatización enlace finanzas; **Config UI** = catálogo defaults (puede ir en paralelo o justo antes de A).
4. Confirmado Luis (2026-08-26): defaults por tamaño + override + precio por registro + enlace finanzas.

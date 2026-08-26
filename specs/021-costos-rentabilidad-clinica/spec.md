# Spec: Costos y rentabilidad de clínica

**ID:** 021-costos-rentabilidad-clinica  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agent (Luis Alfonso Niño Martínez)  
**Extiende:** 014-finanzas-caja-mvp, 018-finanzas-csv-banio-caja  
**Dominio:** #19, #20 (finanzas / baños → caja)

---

## Problema

La caja MVP registra cobros y egresos, pero las doctoras dueñas no ven **cuánto cuesta** hacer un baño, un corte o una cirugía vs **lo que cobran**. Inventario ya guarda `precio_compra` / `precio_venta` / `iva_aplicable`, pero no hay plantillas de costo de servicio ni margen en el cobro. Falta un P&L simple (ingresos vs costos/gastos del día o mes) fácil de leer.

---

## Visión (patrón PMS veterinario adaptado)

| Concepto PMS | En Katzen (esta entrega) |
|--------------|--------------------------|
| COGS / bill of materials | **Plantillas de costo** = lista de ítems (producto inventario o gasto libre) por tipo de servicio |
| Service packages | Plantilla tipificada: baño, corte, cirugía, consulta, otro |
| P&L simple | Dashboard día/mes: ingresos, costos asociados, egresos (publicidad/operativo), margen estimado |
| IVA / SAT | Flag `ivaDeclarado` (caja) + `iva_aplicable` (producto). **CFDI = fase 2** |

---

## User stories — MVP (ahora)

### US-1 — Plantillas de costo de servicio

Como **doctora / admin**  
Quiero **definir plantillas** (baño, corte, cirugía genérica…) con ítems de costo  
Para **saber el costo estimado del servicio**

**Criterios:**

- [x] SC-001: CRUD plantillas en `/admin/finanzas` (tab Costos): nombre, tipo servicio, precio sugerido al cliente, ítems
- [x] SC-002: Ítem = producto inventario (trae `precio_compra`) **o** gasto libre (nombre + monto)
- [x] SC-003: Mostrar costo total estimado y margen vs precio sugerido
- [x] SC-004: Baja lógica («Borrar»), no delete físico

### US-2 — Cobro con categoría y margen

Como **recepcionista / doctora**  
Quiero **al registrar cobro** indicar tipo (baño / corte / cirugía / venta / consulta / otro) y opcionalmente vincular plantilla o costo  
Para **ver margen estimado** del cobro

**Criterios:**

- [x] SC-005: Campo `categoria` en diálogo de caja (obligatorio con default sensato)
- [x] SC-006: Opcional: elegir plantilla → rellena `costoAsociado`; o capturar costo manual
- [x] SC-007: Preview margen = monto − costo (ingresos); CSV incluye categoría y margen
- [x] SC-008: Baño→caja prellena `categoria: banio` (o corte según tipo)

### US-3 — Gastos publicidad / operativos

Como **dueña**  
Quiero **registrar egresos** con categoría publicidad u operativo  
Para **separarlos del costo de servicio**

**Criterios:**

- [x] SC-009: Egresos con categoría `publicidad` | `operativo` | `otro` (+ monto + fecha ya existentes)

### US-4 — Dashboard rentabilidad simple

Como **dueña**  
Quiero **ver ingresos vs costos/gastos** del día o del mes  
Para **entender si el negocio gana** sin ser contadora

**Criterios:**

- [x] SC-010: Tab Rentabilidad: período día | mes; KPIs ingresos, costos asociados, egresos, margen estimado, neto caja
- [x] SC-011: Lenguaje claro en español latino (sin jerga contable densa)

### US-5 — Inventario costo / venta / IVA

Como **admin**  
Quiero **ver y editar costo y precio de venta + IVA** en productos  
Para **alimentar plantillas y márgenes**

**Criterios:**

- [x] SC-012: Producto ya expone costo (`precio_compra`), venta e `iva_aplicable`; labels claros «Costo (compra)» / «Precio de venta» / hint IVA — sin romper legacy

---

## Fuera de alcance (MVP) — Fase 2 / 022

- Facturación electrónica **SAT CFDI** (timbrado, UUID, cancelación)
- BOM automático de cirugía desde historial clínico / salidas de inventario
- Descuento automático de stock al completar baño → planificado en **`specs/022-automatizacion-costos-dashboard/`** (Fase B)
- **Defaults de costo por tamaño de perro** (pequeño/mediano/grande) + override al registrar baño + precio por registro → **022** (Config UI + Fase A)
- COGS FIFO / costo promedio ponderado formal
- Nómina, conciliación bancaria, pasarela de pagos
- Integración nodo legacy `Katzen/Venta`
- Resend / correo (diferido)

### Continuación: baños ↔ finanzas (022)

021 deja plantillas + caja con categoría/margen. **022** añade el catálogo de defaults por tamaño, el prefill/override en el diálogo de baño y el arrastre de `costoAsociado` al flujo baño→caja (018). Ver sección *Baños: defaults por tamaño…* en `specs/022-automatizacion-costos-dashboard/`.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB (aditivo):**

  | Nodo / campo | Lectura | Escritura | Notas |
  |--------------|---------|-----------|-------|
  | `Katzen/Finanzas/PlantillasCosto/{id}` | staff | staff | **nuevo** |
  | `Katzen/Caja/Movimientos.*.categoria?` | staff | staff | opcional |
  | `Katzen/Caja/Movimientos.*.plantillaCostoId?` | staff | staff | opcional |
  | `Katzen/Caja/Movimientos.*.costoAsociado?` | staff | staff | opcional |
  | `Katzen/Caja/Movimientos.*.margenEstimado?` | staff | staff | opcional (stamp) |
  | `Katzen/Inventario/Productos` | — | — | sin cambio estructural; ya tiene compra/venta/IVA |

- **App móvil:** no consume `Caja` ni `Finanzas` hoy → sin impacto. Inventario solo labels UI.
- **Pruebas:** mocks locales (`mock-data.ts`) + Cypress autenticado. Nunca prod.
- **UI:** tabs en módulo `finanzas` existente; `admin-dialog-shell`; KPIs; «Borrar»; política 011 (todo staff).

---

## Roles

Política 011: módulo `finanzas` = acceso completo para todo staff operativo.

---

## UI (rutas)

- `/admin/finanzas` — tabs: **Caja** | **Costos de servicio** | **Rentabilidad**
- Sin nuevo `StaffModule`

---

## Backend

- Reglas RTDB: nodo `Katzen/Finanzas` staff R/W; índice `categoria` en Movimientos
- Sin Cloud Functions en MVP

---

## Notas / decisiones

1. Margen = precio cobrado − costo asociado (estimado). Si no hay costo → margen N/D (no inventar 0).
2. Egresos de publicidad **no** son COGS de servicio: van a egresos categorizados.
3. CFDI / SAT documentado como fase 2 en plan y ROADMAP.

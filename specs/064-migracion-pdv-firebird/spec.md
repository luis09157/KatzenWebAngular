# Spec: Migración PDV Firebird (Eleventa) → KatzenVet

**ID:** 064-migracion-pdv-firebird  
**Estado:** in_progress  
**Fecha:** 2026-08-31  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Relaciona:** constitución + domain-context; inventario 007/043/044; POS 032/042/045/046/050/055/056; finanzas 014/021/022; CFDI 024; mermas 007  
**Inventario FDB (fase 0):** [`inventario-fdb.md`](inventario-fdb.md)  
**Extractor:** `scripts/pdv-eleventa/`  
**Utils:** `src/app/core/utils/pdv-iva-map.util.ts`, `pdv-sku-clasificacion.util.ts`, `pdv-dry-run.util.ts`  
**Impacto IVA (muestra):** [`reporte-impacto-iva-sample.md`](reporte-impacto-iva-sample.md)

---

## Glosario (español llano)

**PDV = Punto De Venta.** Aquí es el programa de caja **eleventa** de Windows, el que guarda todo en el archivo `PDVDATA.FDB`. No es el POS web de Katzen (`/admin/visitas`).

**Clientes del PDV** = compradores que eleventa guardó en esa caja. A veces solo compraron croquetas. **No** son automáticamente dueños de mascota en Katzen. No se fusionan a ciegas con `Katzen/Cliente`.

**Freeze (corte elegido por defecto):** un día (o unas horas) **se deja de cobrar en eleventa**, se copia el FDB, se importa el stock de ese momento, y **desde ahí solo se cobra en la web**. Así el anaquel no miente.

**Doble captura (prohibida):** cobrar en eleventa y en la web al mismo tiempo. El stock se descuadra. **No se hace.**

---

## Problema

La clínica cobra **hoy** en **eleventa** (Windows, Firebird `PDVDATA.FDB`): catálogo real (~700 productos, barras EAN + SKU `KTZ`/`VAC`/`BACO`), tickets (~6k), kits de vacunas/baños, kardex y una caja `KATZEN-VET`. El admin web ya tiene punto de venta (`/admin/visitas`) e inventario (`Katzen/Inventario/Productos`), pero el anaquel y el hábito de mostrador siguen en el PDV de escritorio.

Hay que **importar lo guardado** (catálogo + stock **y** historial de tickets) y **acoplar la lógica de caja al POS web, mejorada**. No clonar pantallas Delphi ni Crystal.

---

## Plan de trabajo — lo que conviene al web (cerrado)

Criterio: **Katzen web manda**. Eleventa es fuente de datos, no de diseño. Se conserva todo lo ya capturado; se tira lo que empeora el sistema (UI vieja, Crystal, CFDI del PDV, cajeros Firebird, sync eterno).

| Ola | Nombre | Qué entra | Criterio de “terminado” |
|-----|--------|-----------|-------------------------|
| **A** | Anaquel real | Extraer FDB → dry-run → import catálogo + stock + IVA ×1.16 + baños `BACO*` enlazados a 022 + servicios `EXAM`/domicilio a 056 + kits SKU+BOM + proveedores | Cajero cobra en `/admin/visitas` con el mismo anaquel; `npm run test:064` + N vs N |
| **B** | Caja web al nivel de mostrador | Devolución + stock, corte/arqueo, pago mixto, scanner EAN, costo oculto al cajero | Un día de clínica se puede cerrar **sin** eleventa (aún con historial viejo solo en archivo) |
| **C** | Memoria (todo el historial, sin ensuciar el POS) | ~6k tickets + líneas como **archivo** `origenPdv` para reportes/finanzas. **No** 6k visitas vivas en la cola del día | Conteos N vs N; el POS del día sigue rápido |
| **D** | Corte | Freeze: se deja de cobrar en eleventa → re-extract stock → solo web. FDB backup cifrado. Sin puente bidireccional | Un día operativo 100 % en Katzen |

**Por qué el historial no va al POS del día:** 6k tickets en `Visitas` activas vuelven lenta la caja y mezclan ventas viejas de eleventa con la cuenta de hoy. Se **conservan todas** en un archivo consultable (reportes), que es lo que conviene al web.

**Kardex (~950):** no se clona. El stock del freeze es la verdad. Movimiento único de auditoría por SKU.

**CFDI / certificados del FDB:** no se migran (spec 024 ya cubre datos fiscales; PAC después).

---

## Decisiones de Luis (2026-08-31) — no volver a preguntar

| # | Tema | Decisión (seguir esto) |
|---|------|------------------------|
| 1 | Alcance datos | **TODO:** catálogo + stock **y** historial de tickets (~6k). Fase 5 **incluida**, no opcional. |
| 2 | Cutover | **Freeze por defecto.** Explicación arriba. Doble captura **no**. |
| 3 | Kits | **Sí.** En el sistema nuevo: vender el **paquete como un SKU** (mostrador) **y** enlazar/explotar componentes para bajar stock real (BOM). Lo que ya existe en el FDB se importa y se enlaza; no se tira. |
| 4 | Baños | Pegar a lo que ya tiene el web (tarifa 022 / riel peluquería) **pero** los `BACO*` y precios ya guardados se **enlazan y se agregan**, no se recargan a mano ni se pierden. |
| 5 | Clientes PDV | **No fusionar a ciegas** con `Katzen/Cliente`. Importar listado PDV para revisión; si teléfono/nombre coincide con dueño, **enlazar**; si no, no crear expediente clínico fantasma. Walk-in sigue `__mostrador__`. |
| 6 | IVA | Precios eleventa **NO incluyen IVA**. En Katzen el precio al público **incluye IVA 16%**. Fórmula abajo. Nunca sumar 16% otra vez en caja. |

### Fórmula IVA (obligatoria al importar)

```
precio_venta (incluye IVA) = round(PFINAL * 1.16, 2)   // o PVENTA si PFINAL no existe en el DDL
precio_neto                = precio_venta / 1.16
precio_compra              = PCOSTO                     // costo; no multiplicar IVA
ganancia                   = precio_neto − precio_compra
```

Casos de test (gate): `100 → 116`, redondeo a 2 decimales, `0`, `null`.  
Generar reporte «precio que pagaban vs precio web con IVA» para que Luis vea el impacto al cliente.  
Si la categoría sugiere tasa 0 (medicamento/vacuna/examen), el dry-run **avisa**; no se cambia la fórmula por defecto sin una fila explícita en el reporte de excepciones.

---

## User stories

### US-1 — Inventario del FDB (fase 0, hecha)

Como **dueño / operador**  
Quiero **saber qué hay en el Firebird**  
Para **migrar con mapa, no a ciegas**

**Criterios:**

- [x] SC-001: Software eleventa; FDB **no** en el repo
- [x] SC-002: Tablas + volúmenes en `inventario-fdb.md`
- [x] SC-003: Muestra de productos **sin PII**; CSD no migrable
- [x] SC-004: Sin `isql`/Docker en este Mac; COUNT exacto = fase 1

### US-2 — Extraer y mapear sin tocar producción

Como **desarrollador**  
Quiero un **extractor local** (copia del FDB → JSON/CSV UTF-8) y utils de mapeo con tests  
Para **dry-run en emulador/mocks**

**Criterios:**

- [ ] SC-005: Script fuera de prod; input = **copia** en `tmp/` (nunca el FDB en uso de Downloads como único); output gitignored
- [ ] SC-006: Mapa `pdv_id` / `CODIGO` → key RTDB **nueva**; `id-map` sin PII
- [ ] SC-007: CP1252 → UTF-8; duplicados reportados
- [ ] SC-008: Dry-run **solo** emulador o mocks. Prohibido `katzen-a0e3e`
- [ ] SC-008b: Tests IVA + clasificación + dry-run (`npm run test:064`) en verde **antes** de fase 2/3

### US-3 — Importar catálogo + stock

Como **recepcionista / inventario**  
Quiero **productos y existencias** en `Katzen/Inventario/Productos`  
Para **cobrar en `/admin/visitas` con el mismo anaquel**

**Criterios:**

- [ ] SC-009: Import aditivo a `Katzen/Inventario/Productos` (no nodos móvil)
- [ ] SC-010: `codigo_barras` = EAN o `KTZ…`/`VAC…`/`BACO…` (único)
- [ ] SC-011: `precio_compra` ← `PCOSTO`; `precio_venta` ← fórmula IVA (arriba)
- [ ] SC-012: `stock_actual` ← existencia al freeze (1 ajuste inicial; no 950 kardex)
- [ ] SC-013: `activo: false` si `ELIMINADO_EN` o depto «Eliminado»
- [ ] SC-014: `iva_aplicable` + `tasa_iva` 16 en catálogo gravado; POS no vuelve a sumar IVA
- [ ] SC-015: N FDB vs N importados; sample 20 SKU; valuación; excepciones
- [ ] SC-016: **Producción solo con autorización explícita de Luis** + backup

### US-4 — Paridad de flujos POS (mejorada)

Como **cajero en mostrador**  
Quiero **vender, cobrar, descontar, devolver y cortar caja en la web**  
Para **apagar eleventa**

**Criterios:**

- [ ] SC-017: Venta, cobro (efectivo/tarjeta/transferencia, mixto), descuento, walk-in, salida stock, ticket interno
- [ ] SC-018: Devolución + stock; corte de caja/turno; pago mixto; kits SKU+BOM; scanner EAN
- [ ] SC-019: **No clonar:** UI eleventa, Crystal, pulso, Mercado Pago PDV, CFDI del FDB, recargas TA
- [ ] SC-020: Costo **nunca** en UI de cajero

Si un gap de POS es enorme → spec hija, **pero el pipeline de datos (fases 1–3 y 5) no se detiene**.

### US-5 — Cutover freeze

Como **dueño**  
Quiero **un corte claro**  
Para **no desfasar stock**

**Criterios:**

- [ ] SC-021: Freeze (no doble captura; no sync bidireccional)
- [ ] SC-022: Checklist de apagado (fase 6). El agente documenta; **Luis** opera la clínica. El agente **no** apaga Windows remoto.

### US-6 — Historial de tickets (fase 5, incluida)

Como **dueño**  
Quiero **los ~6k tickets** en web (lotes, `origenPdv`)  
Para **no perder el historial de caja**

**Criterios:**

- [ ] SC-023: Import por lotes a `Katzen/Visitas` aditivas `origenPdv: 'eleventa'`; no inventar CxC clínico
- [ ] SC-024: Gate: N tickets FDB vs N importados; suma de líneas = encabezados
- [ ] SC-025: Clientes PDV: listado para revisión; enlace si teléfono/nombre coincide; si no, ticket a walk-in / cliente PDV suelto **sin** expediente clínico

---

## Fuera de alcance

- `firebase deploy` / writes a `katzen-a0e3e` sin autorización de Luis
- Copiar `PDVDATA.FDB` ni CSD/FIEL al repositorio
- Import kardex completo (`HISTORIAL_INVENTARIO` ~950) en la misma ola que el snapshot de stock
- Fusionar clientes PDV → `Katzen/Cliente` a ciegas
- Migrar usuarios/passwords Firebird → Firebase Auth
- Timbrado CFDI / PAC (024: datos fiscales sí)
- App móvil: no alterar `Katzen/Producto` / `Katzen/Productos`
- Clonar `VENTAS_SEMANALES` / Crystal / nómina
- Doble captura / sync Eleventa↔RTDB permanente
- El agente no opera el freeze en la PC de la clínica (solo checklist)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** fases 0–2 ninguno en prod. Fases 3+ **solo aditivo**, emulador primero:

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Inventario/Productos/{id}` | staff | emulador → prod auth Luis | opcionales `origenPdv`, `pdvCodigo`, `pdvId`, `esKit`, `kitComponentes` |
  | `Katzen/Inventario/Movimientos/{id}` | staff | 1 ajuste inicial por SKU | no clonar 950 kardex |
  | `Katzen/Inventario/Proveedores/{id}` | staff | alta GoPet/Surtipet/Petiklar/Whippet si faltan | |
  | `Katzen/ServiciosClinica/{id}` | staff | domicilio / exámenes cobrados como producto | 056 |
  | Tarifas baño 022 / riel peluquería | staff | **enlazar** `BACO*` + precios; no borrar | |
  | `Katzen/Visitas/{id}` | staff / client propio | fase 5 lotes `origenPdv` | no CxC clínico inventado |
  | `Katzen/Caja/Movimientos/{id}` | staff | solo si el ticket PDV trae cobro claro | |
  | `Katzen/Cliente/{id}` | — | **no** bulk; solo enlace tras revisión | |
  | Listado revisión PDV (nodo staff o CSV gitignored) | staff | import listado | PII no en git |
  | `Katzen/Usuarios` / Auth | — | **no** desde Firebird | |
  | `Katzen/Producto` / `Katzen/Productos` | móvil | **prohibido** | constitution |

  IDs RTDB = push keys, **nunca** el entero Eleventa.

- **Estrategia de Datos de Prueba:** mocks (`pdv-sample-rows.ts`, `mock-data.ts`) + emulador. FDB solo local. Prohibido producción hasta el final de la cadena + backup + OK Luis.

- **Patrones UI:** `/admin/visitas` (055), picker 044, spec 059/061, `LoadingService`, copy **Borrar**. Scanner 055-2 justificado por ~296 EAN.

---

## Mapeo PDV → Katzen

| Origen Eleventa | Destino Katzen | Modo |
|-----------------|----------------|------|
| `PRODUCTOS` activos | `Inventario/Productos` | 1:1 transformado + IVA |
| `PCOSTO` | `precio_compra` | sin IVA |
| `PFINAL` / `PVENTA` | `precio_venta` | `round(x * 1.16, 2)` |
| Existencia al freeze | `stock_actual` + 1 movimiento | snapshot |
| `CODIGO` | `codigo_barras` | 1:1 si único |
| `KTZ*` | anaquel clínico | según depto |
| `VAC*` | `categoria: vacuna` | no duplicar 052 |
| `BACO*` / «Baño …» | tarifa 022 + riel peluquería **enlazado** | no tirar SKU |
| `EXAM*` / Domicilio | `ServiciosClinica` | split |
| `COMPONENTES` kits | SKU paquete + BOM `kitComponentes` | importar y enlazar |
| `HISTORIAL_INVENTARIO` | kardex | diferir (snapshot basta para cobrar) |
| Tickets / líneas | `Visitas` + caja | **fase 5 incluida** |
| `CLIENTES` PDV | listado revisión; enlace si match | no expediente fantasma |
| `PROV` | `Inventario/Proveedores` | nombres comerciales |
| `USUARIOS` PDV | mapa manual staff | sin password |
| `ABONOS` / crédito tienda | no clonar módulo | no CxC clínico |
| `FACTURAS` / CSD | — | no migrar |
| UsoInterno | merma 007 | no venta |

---

## Roles

| Rol | POS/inventario web | Import prod |
|-----|--------------------|-------------|
| administrador / doctor (dueña) | sí | **solo Luis autoriza** write prod |
| recepcionista / peluquero | sí operativo | no |
| cajero Eleventa | no es rol Firebase | — |
| cliente portal | no catálogo interno | — |

---

## Backend

- Script local + emulador (preferido). Callable import **solo si** Luis lo pide (`isCallerAdmin`).
- Reglas RTDB aditivas si hay campos nuevos.
- Deny-list script: nunca escribir `Katzen/Producto` ni `Katzen/Productos`.

---

## Testing mínimo (gates — ver `tasks.md`)

No pasar de fase si el gate falla. `npm run test:064` + guía QA. `npm run build` cuando haya código de app.

---

## Huecos (ya cubiertos en plan; no re-preguntar)

Devoluciones, corte de caja, pago mixto, kits BOM, recetas/controlados, lotes, encoding, CSD en el FDB, demo POS 055, scanner EAN, una sucursal.

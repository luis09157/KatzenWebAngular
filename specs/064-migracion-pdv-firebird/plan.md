# Plan técnico: Migración PDV Firebird (Eleventa) → KatzenVet

**Spec:** `specs/064-migracion-pdv-firebird/spec.md`  
**Estado:** in_progress  
**Inventario FDB:** `inventario-fdb.md`  
**Constitución / dominio:** leídos 2026-08-31 — RTDB **aditivo**; no prod; no romper móvil.

**Cómo usar este plan:** un agente sigue las **olas A→D** (abajo) de corrido. Las fases 1–6 técnicas se mapean así: A = 1+2+3; B = 4; C = 5 (archivo, no cola POS); D = 6. No volver a preguntar las 6 decisiones. Si un gate falla, **no** avanzar. Specs hijas de POS no paran el pipeline de datos.

**Historial (ola C):** tickets eleventa → archivo `origenPdv` / reportes. **Prohibido** volcar 6k filas como visitas del día en `/admin/visitas`.

---

## Resumen

FDB eleventa (685 SKU, 4739 tickets, 9395 líneas, 9708 kardex). Importar **catálogo + stock + historial de tickets**. Cutover = **freeze**. IVA: `precio_venta = round(PVENTA * 1.16, 2)` (no hay `PFINAL`). Kits = SKU + BOM `V00x`. Baños `BACO*` se enlazan. Clientes PDV = **0** → `__mostrador__`.

**PDV** = Punto De Venta = eleventa Windows (el `.FDB`).  
**Freeze** = un día/unas horas se deja de cobrar en eleventa, se copia el FDB, se importa ese stock, y desde ahí solo se cobra en la web.

---

## Fases (orden + gates)

| Fase | Qué | Gate (obligatorio) | Si falla |
|------|-----|-------------------|----------|
| **0** | Inventario FDB | Hecho | — |
| **1** | Extractor FB 2.5 + copia tmp | Docker/`isql` abre ODS 10 **o** extract Windows; `COUNT(*)` = filas exportadas; `.gitignore` FDB; `npm run test:064` | Corregir extractor; **no** pasar a import. Utils IVA sí pueden seguir. |
| **2** | Dry-run emulador/mocks | Tests duplicados, costo≥neta, IVA, kits huérfanos, clasificación; cero writes `katzen-a0e3e` | No fase 3 |
| **3** | Import catálogo+stock | Emulador primero; N vs N; sample 20 SKU; valuación; deny-list móvil | No prod. Prod = final de cadena + backup + OK Luis |
| **4** | POS: devolución, corte, mixto, kits BOM, scanner | QA guía + unitarios; specs hijas si el gap es enorme | Datos siguen; no apagar eleventa |
| **5** | Historial tickets **incluido** | N tickets vs N importados; suma líneas; `origenPdv`; no CxC clínico inventado | Rehacer lote; no prod |
| **6** | Freeze operativo | Checklist; Luis en clínica; agente **no** apaga Windows remoto | No freeze hasta POS cubra el día |

---

## Fase 0 — Inventario (HECHA)

Evidencia: `inventario-fdb.md`. Mac sin `isql`/Docker al 2026-08-31. Conteos exactos = fase 1.

---

## Fase 1 — Extractor local (ejecutar YA)

**Objetivo:** DDL real + `COUNT(*)` + sample productos **sin CSD ni PII en spec**.

### Pasos (no improvisar)

1. Confirmar `.gitignore`: `*.fdb`, `pdv-extract.json`, `scripts/pdv-eleventa/out/`, certificados. **Nunca** copiar el FDB al repo.
2. Copiar FDB a `tmp/pdv-eleventa/PDVDATA.FDB` (gitignored). **No** montar `/Users/luisnino/Downloads/PDVDATA.FDB` en escritura como único archivo de trabajo.
3. Firebird **2.5** (ODS 10). FB 3+ no abre este archivo.
4. Correr `bash scripts/pdv-eleventa/extract.sh`
   - Si hay Docker: `jacobalberty/firebird:2.5-ss --platform linux/amd64` + `isql` SYSDBA/`masterkey` (o credenciales que dé Luis; no adivinar).
   - Si **no** hay Docker: el script sale 2. Entonces: instrucciones `scripts/pdv-eleventa/README.md` (Windows clínica, eleventa **cerrado**). **No detener** el resto: implementar/mantener utils de mapeo.
5. Queries: `scripts/pdv-eleventa/queries.sql` (`COUNT`, `SHOW TABLE PRODUCTOS`, `FIRST 20` sin PII).
6. CP1252 → UTF-8 en el export JSON (`pdv-extract.json` gitignored).
7. **No** `SELECT` de `FACTURACION_CERTIFICADOS`.

### Gate 1

- [ ] Copia en `tmp/`, original de Downloads intacto
- [ ] `COUNT(*)` PRODUCTOS / VENTATICKETS / líneas = filas en el JSON
- [ ] Sample 20 SKU en log o spec **sin** nombres de clientes ni CSD
- [ ] `npm run test:064` exit 0 (IVA 100→116, redondeo, 0, null; clasificación KTZ/VAC/BACO/EXAM; dry-run)

### Si Docker no abre (estado 2026-08-31 en este Mac)

Extractor escrito + README Windows. Seguir con utils (IVA, clasificación, dry-run) usando `pdv-sample-rows.ts` (samples de `inventario-fdb.md`). El COUNT SQL queda pendiente de la PC de clínica o de instalar Docker Desktop; **no bloquea** fase 2 sobre samples ni el código de mapeo.

---

## Fase 2 — Dry-run (emulador / mocks)

**Prohibido:** cualquier write o read a `katzen-a0e3e`.

1. Cargar `pdv-extract.json` si existe; si no, `PDV_SAMPLE_ROWS`.
2. Correr `dryRunExtractPdv` → excepciones: duplicados `CODIGO`, `PCOSTO ≥ neta`, sin precio, stock&lt;0, kits huérfanos, IVA vs exento sugerido.
3. Clasificar: anaquel / vacuna / baño / servicio / examen / kit / uso_interno.
4. Generar **reporte impacto IVA** (`reporteImpactoIvaCliente`) para Luis (CSV gitignored).
5. Clientes PDV: extract **listado** (nombre/teléfono) a archivo gitignored; algoritmo de match (teléfono normalizado / nombre) solo marca candidatos; **cero** altas a `Katzen/Cliente`.
6. Mocks sample en `mock-data.ts` o `pdv-sample-rows.ts` (ya hay).

### Gate 2

- [x] `npm run test:064` verde (utils + reglas import)
- [x] Reportes CSV gitignored sobre extract 685
- [x] Ningún cliente Firebase de prod (`CLIENTES` = 0)
- [x] Deny-list en `import-emulator.mjs` / `pathRtdbPermitidoPdv`

---

## Fase 3 — Import catálogo + stock

**Emulador primero.** Producción `katzen-a0e3e` **solo al final de toda la cadena** (fases 1–5 listas o POS mínimo operable) con backup RTDB + OK explícito de Luis. **No** `firebase deploy`.

1. Script `scripts/pdv-eleventa/` (Node + `firebase-admin` **contra emulador** `127.0.0.1:9000`). Variable de entorno `PDV_RTDB_TARGET=emulator|prod`. Default `emulator`. Prod requiere `PDV_CONFIRM_PROD=LUIS` **y** no se ejecuta en CI/agente sin esa flag.
2. Upsert por `codigo_barras`; si no existe, `push()` + `origenPdv: 'eleventa'`, `pdvCodigo`, `pdvId`.
3. Precios con `mapearPreciosPdvAKatzen`.
4. Un movimiento `ajuste`/`entrada` por SKU, `motivo: 'Migración eleventa YYYY-MM-DD'`.
5. `BACO*`: alta/enlace a tarifa 022 + inventario peluquería; **no** pedir recarga manual.
6. Kits: guardar SKU + `kitComponentes` (BOM). Hijos deben existir o quedar en excepciones (no borrar el kit).
7. Proveedores: GoPet, Surtipet, Petiklar, Whippet si faltan.
8. Apagar ítems `soloDemo` POS 055 en caja real (no escribir demos a RTDB).
9. Deny-list: abortar si el path empieza con `Katzen/Producto/` o `Katzen/Productos`.

### Gate 3

- [x] Emulador: 685 exportadas = 685 escritas (159 `activo:false` uso interno)
- [x] Sample V003 / BACO001 / KTZ056 / EAN / MI uso interno vs extract
- [x] Valuación visibles con stock: costo $128 000.60 / venta $263 889.56
- [x] Cero writes nodos móvil (deny-list)
- [x] Backup RTDB inventario **antes** de prod (`tmp/pdv-eleventa/backup-prod-inventario-2026-09-01T07-28-45.json`)
- [x] Prod catálogo 685=685 (2026-09-01, OK Luis). Spec no done.
- [x] `npm run build` exit 0

**Rollback:** `activo: false` vía `id-map`; restaurar backup; no `remove()` masivo de legacy.

---

## Fase 4 — Paridad POS web

No clonar pantallas. Extender `/admin/visitas` + inventario. **No parar** fases 3/5 por un gap enorme: abrir spec hija y seguir datos.

| Flujo | Katzen hoy | Acción (sin preguntar) |
|-------|------------|------------------------|
| Venta + scanner | 055 ola 1; scanner ola 2 | Implementar scanner EAN (hay ~296) |
| Cobro efectivo/tarjeta/transfer | 032/050 | Completar **pago mixto** en un ticket |
| Descuento % | — | UI cajero controlada por rol |
| Walk-in | 046 `__mostrador__` | Mantener |
| Baja stock | 042 + 007 | Bloqueo negativo se queda |
| Devolución | incompleto | **Construir** reintegro stock + `FUE_DEVUELTO` |
| Corte de caja | movimientos 014 | **Construir** fondo / arqueo / diferencia |
| Kits | no | SKU en ticket **y** explode BOM a stock |
| Baños | 022 / riel | Usar precios `BACO*` enlazados |
| Crédito Eleventa | CxC visitas | No clonar; no inventar saldo de dueño |
| UsoInterno | — | Merma 007 |
| Costo en caja | oculto | Seguir oculto |

### Gate 4

- [ ] Unitarios de devolución/stock, mixto, BOM (cuando exista código)
- [ ] `specs/templates/qa-validation-guide.md` en POS (chips, loading, 059, 061)
- [ ] `npm run build` exit 0
- [ ] Live preview `:4200` + smoke `/admin/visitas`
- [ ] Cypress smoke POS si hay ruta tocada
- [ ] **No** apagar eleventa hasta este gate + freeze

---

## Fase 5 — Historial de tickets (INCLUIDA)

Peso: ~6k encabezados + ~10–12k líneas. RTDB no es SQL → **lotes** (p. ej. 200 tickets).

1. Extract `VENTATICKETS` + `VENTATICKETS_ARTICULOS` (sin CSD).
2. Cada visita: `origenPdv: 'eleventa'`, folio/serie snapshot, líneas con `PRODUCTO_CODIGO`.
3. Cliente: si hay match revisión → `clienteId` Katzen; si no → `__mostrador__` o id de “cliente PDV” **sin** mascota/expediente.
4. **No** copiar `ABONOS` a `Cliente.saldoPendiente` clínico.
5. Kits históricos: respetar snapshot de línea; no recalcular BOM hacia atrás si el componente ya no existe.
6. Emulador primero; prod solo con OK Luis + backup.

### Gate 5

- [ ] `COUNT(VENTATICKETS)` = N importadas (no canceladas según regla: `CANCELADA_EN` → visita cancelada, no omitir en silencio)
- [ ] Suma de líneas importadas = `COUNT(VENTATICKETS_ARTICULOS)` del lote
- [ ] Sample 10 tickets: total encabezado ≈ suma líneas (tolerancia redondeo)
- [ ] Cero CxC clínico inventado (assert `saldoPendiente` de dueños no cambia por el lote)

---

## Fase 6 — Freeze (Luis en la clínica)

El agente **documenta** y **no** apaga la PC Windows remota.

### Checklist operativa (Luis)

1. POS web cubre el día: venta, cobro, stock, baño enlazado, consulta, devolución mínima, corte.
2. Avisar al equipo: **hoy no se cobra en eleventa**.
3. Cerrar eleventa → copiar FDB → extractor → mini re-import de **stock** (delta).
4. Encender solo caja web.
5. Guardar FDB + CSD **aparte y cifrados** (CSD nunca en git).
6. Eleventa queda archivo / solo lectura.

Día paralelo (cobrar en los dos) = **no**. Si algo falla en web, se **reabre eleventa** y se aborta el freeze; no se mezclan ventas.

### Gate 6

- [ ] Checklist firmada (mensaje de Luis)
- [ ] Stock web = existencia del FDB de freeze (sample)
- [ ] Primera venta web de un EAN real

---

## Archivos

| Archivo | Fase | Notas |
|---------|------|-------|
| `scripts/pdv-eleventa/*` | 1+ | extractor; out gitignored |
| `src/app/core/utils/pdv-*.ts` | 1–2 | IVA, SKU, dry-run |
| `src/app/shared/inventario.models.ts` | 1 | campos opcionales `origenPdv`, kits |
| `src/app/core/testing/mock-data.ts` | 2 | samples sin PII |
| `src/app/inventario/*` | 3–4 | solo si hace falta UI |
| `src/app/visitas/*` | 4 | devolución / corte / BOM / scanner |
| `database.rules.json` | 3+ | aditivo si nodos nuevos |
| `functions/src/index.ts` | opcional | callable solo si Luis lo pide |

---

## Modelo de datos (aditivo)

```text
Katzen/Inventario/Productos/{pushId}
  codigo_barras, nombre, categoria, subcategoria
  precio_compra            # PCOSTO
  precio_venta             # round(PVENTA * 1.16, 2) — incluye IVA
  iva_aplicable, tasa_iva  # 16 gravado; POS no vuelve a sumar
  stock_actual             # max(0, DINVENTARIO); 0 en baño/servicio/examen
  activo                   # false si uso interno / UI* / MI*
  visiblePos?: boolean
  origenPdv?: 'eleventa'
  pdvCodigo?: string
  esKit?: boolean
  kitComponentes?: [{ codigo, cantidad }]

Katzen/Inventario/PdvCodigoMap/{codigo}
Katzen/Inventario/PdvEnlacesBaco/{BACO*}
Katzen/ServiciosClinica/{push}   # EXAM / cirugía / domicilio

Katzen/Visitas/{pushId}          # fase 5
  origenPdv?: 'eleventa'
  pdvFolio?: string
```

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ver spec. App móvil **no afectada** si no se toca `Katzen/Producto(s)`.

  | Nodo / campo | Acción | ¿Móvil? | Notas |
  |--------------|--------|---------|-------|
  | `Inventario/Productos` | altas + opcionales | no | |
  | `Inventario/Movimientos` | ajuste inicial | no | |
  | `ServiciosClinica` / baño 022 | altas/enlace BACO | no | |
  | `Visitas` | fase 5 lotes | no (portal lee propias) | `origenPdv` |
  | `Cliente` | solo enlaces revisados | no | |
  | `Katzen/Producto(s)` | **no tocar** | sí si se tocara | deny-list |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales

- **Estrategia de Datos de Prueba:** mocks + emulador. FDB local. Prod al final + backup + Luis.

- **Patrones UI:** POS 032/055, inventario, picker 044, diálogos 059, páginas 061, `LoadingService`, `.row-actions`.
  - [x] Sin librerías UI externas
  - [x] `ADMIN-UI-ARCHITECTURE.md`

---

## Plan de Mitigación y Rollback

- [x] Fases 0–1 actuales: no cambian contratos RTDB de prod.
- [ ] `npm run build` — correr en cada entrega de código (fase 1 utils = sí).
- [x] Reversión documentada.

| Escenario | Rollback |
|-----------|----------|
| Mapeo de precios mal | no prod; corregir util; re-dry-run |
| Import prod sucio | `activo: false` vía id-map; restaurar backup inventario |
| Stock ≠ F4 | freeze ventas web; reajuste supervisor 007 |
| Write a nodos móvil | restaurar backup; deny-list |
| CSD en git | rotar SAT **con Luis**; purgar git **con Luis** |
| POS incompleto | **no** fase 6 |
| Eleventa vendió durante import | stock mentiroso → re-extract freeze |
| Docker no abre | Windows isql; no bloquear utils |

---

## Deploy

Fases 0–5 emulador: **ningún** `firebase deploy`.

```bash
npm run test:064
npm run build
# SOLO con autorización de Luis Alfonso Niño Martínez:
# firebase deploy --only hosting    # si hay UI fase 4
# firebase deploy --only database   # si reglas nuevas
```

---

## Riesgos

- Docker 64-bit no abre ODS 10.1 Win32; extractor usa Firebird 2.5 i386 + Colima.
- Doble venta = inventario mentiroso → freeze.
- 6k tickets en RTDB: lotes obligatorios.
- Certificados SAT en el mismo FDB.
- Medicamento/vacuna: dry-run avisa tasa 0 vs *1.16; Luis ve el reporte de impacto.

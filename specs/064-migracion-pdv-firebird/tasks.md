# Tasks: Migración PDV Firebird (Eleventa) → KatzenVet

**Spec:** `specs/064-migracion-pdv-firebird/spec.md`  
**Plan:** `specs/064-migracion-pdv-firebird/plan.md`  
**Inventario FDB:** `specs/064-migracion-pdv-firebird/inventario-fdb.md`

> El agente trabaja **todas las fases de corrido**. No marcar `[x]` sin evidencia en **Testing y validación exhaustiva**. Si un gate falla, no avanzar de fase.

---

## Decisiones Luis (2026-08-31) — registradas

- [x] Alcance: catálogo + stock **y** historial ~6k (fase 5 incluida)
- [x] Cutover: freeze por defecto; doble captura prohibida
- [x] Kits: SKU de paquete + BOM; importar y enlazar lo del FDB
- [x] Baños: tarifa 022 / riel; `BACO*` y precios se enlazan, no se tiran
- [x] Clientes PDV: no fusión ciega; listado revisión; match teléfono/nombre; walk-in `__mostrador__`
- [x] IVA: eleventa sin IVA; web `round(PFINAL * 1.16, 2)`; costo = PCOSTO; ganancia = neta − costo

---

## Implementación

### Fase 0 — Inventario FDB

- [x] Constitución y domain-context leídos
- [x] FDB inspeccionado (tamaño, páginas, tablas, samples sin PII)
- [x] Identificado eleventa / `KATZEN-VET`
- [x] `inventario-fdb.md` + spec + plan + tasks
- [x] Índice `specs/README.md`
- [x] SQL `COUNT(*)` exacto (FB 2.5 i386 / Colima, 2026-08-31): PRODUCTOS 685, VENTATICKETS 4739, líneas 9395, CLIENTES 0, kardex 9708, kits 10

### Fase 1 — Extractor local (no prod)

- [x] `.gitignore` `*.fdb`, extractos, certificados
- [x] Copia de trabajo en `tmp/pdv-eleventa/` (gitignored); original Downloads no montado en escritura
- [x] Script `scripts/pdv-eleventa/extract.sh` + `queries.sql` + README Windows
- [x] Docker Firebird 2.5 **i386** abre ODS 10.1 y vuelca DDL + COUNT + sample
- [x] Utils IVA + clasificación + dry-run + `npm run test:064`
- [x] **No** exportar certificados
- [x] Extract JSON: PK = `CODIGO` (no hay `ID` / `PFINAL`); `pdv-extract.json` 685 = COUNT
- [x] `pdv-extract.json` UTF-8 (gitignored, 685 productos)

**Gate 1:** `npm run test:064` verde. COUNT PRODUCTOS **685** = filas en `pdv-extract.json`. Imagen 64-bit no abre el FDB; i386 sí.

### Fase 2 — Dry-run emulador / mocks

- [x] Motor `dryRunExtractPdv` (duplicados, costo≥neta, kits huérfanos, IVA vs exento, clasificación)
- [x] Samples `pdv-sample-rows.ts` desde inventario-fdb (sin PII)
- [x] Dry-run sobre extract SQL real (`import-emulator.mjs` 685 filas)
- [x] Reportes CSV gitignored: impacto IVA, exclusiones POS, stock 0, costo≥precio vendible
- [x] Clientes PDV: `COUNT=0` → no hay listado ni write `Katzen/Cliente`
- [x] Cero conexión a `katzen-a0e3e`

**Gate 2:** tests dry-run verdes. No fase 3 prod.

### Fase 3 — Import catálogo + stock (emulador primero)

- [x] Script import default emulador (`PDV_RTDB_WRITE=1`); prod aborta
- [x] Backup inventario RTDB **antes** de prod
- [x] Escritura solo `Katzen/Inventario/*` + `ServiciosClinica` / `PdvEnlacesBaco`
- [x] Deny-list `Katzen/Producto` / `Katzen/Productos`
- [x] Movimiento `ajuste` por SKU visible con stock > 0
- [x] Enlace `BACO*` (18) + kits BOM en `kitComponentes` (`V002=3;…`)
- [x] N vs N 685=685; sample V003/BACO/KTZ056/EAN/uso interno; valuación visibles $128 000 / $263 890
- [x] `origenPdv` / `pdvCodigo` / `visiblePos` opcionales
- [ ] Apagar catálogo `soloDemo` POS 055 en caja real (cuando se cobre en web)
- [x] Prod catálogo: `import-prod.mjs` + `PDV_CONFIRM_PROD=LUIS` + OK Luis 2026-09-01 (faltan kits explode / historial / freeze)

**Gate 3 emulador:** PASS 2026-08-31. **Gate 3 prod catálogo:** PASS 2026-09-01 (685=685; no hosting).

### Fase 4 — Paridad POS web (no para el pipeline de datos)

- [x] Devolución + reintegro stock (utils + `devolverLineas` + botón en ticket)
- [x] Corte / arqueo de caja (`Caja/Cortes` + diálogo en Finanzas)
- [x] Pago mixto (efectivo + tarjeta + transferencia en un ticket)
- [ ] Kits: SKU en ticket + explode BOM
- [x] Scanner: sheet código/QR ya existía (cámara pendiente)
- [x] Costo oculto al cajero (sin cambio; se mantiene)
- [ ] Specs hijas si el alcance se parte (**sin** parar fases 3/5)

**Gate 4:** QA guía + unitarios + build. No apagar eleventa.

### Fase 5 — Historial tickets (incluida)

- [x] Decisión Luis: sí, ~6k
- [ ] Extract tickets + líneas (lotes)
- [ ] Import emulador `origenPdv`, sin CxC clínico inventado
- [ ] Match clientes: enlace o walk-in / PDV suelto sin expediente
- [ ] Gate: N vs N + suma de líneas

### Fase 6 — Freeze (Luis opera la clínica)

- [ ] Checklist documentada (plan fase 6)
- [ ] Agente **no** apaga Windows remoto
- [ ] Re-extract delta stock post-freeze
- [ ] PDV archivo; FDB backup cifrado; CSD aparte

### Backend / frontend

- [x] Campos opcionales en `Producto` (`origenPdv`, kit)
- [ ] Reglas RTDB aditivas si aplica
- [ ] Cloud Function import solo si Luis la pide
- [ ] UI según admin-ui-architecture / 059 / 061

---

## Testing

> **Quién ejecuta:** el agente. Luis no es el QA por defecto.

Ejecutar y marcar **solo tras evidencia**:

- [x] `npm run test:064` — 37/37 (IVA, SKU, depto, reglas import)
- [x] `npm run build` — exit 0
- [x] Servidor local :4200 — vivo (sin UI nueva de import)
- [x] Dry-run + import emulador `demo-katzen-pdv` :9000 — 685=685
- [x] Import prod `katzen-a0e3e` — 685=685 (2026-09-01). URL: https://katzen-a0e3e.web.app/admin/inventario/productos
- [x] Sample emulador vs extract (V003 290, BACO001 232, KTZ056 BOM 3, 10256 inactivo)
- [ ] Cypress POS (fase 4)

---

## Testing y validación exhaustiva

> Guía: `specs/templates/qa-validation-guide.md`  
> Gates por fase: no avanzar si fallan.

### Gates por fase

| Fase | Gate | Resultado | Notas |
|------|------|-----------|-------|
| 0 | Inventario documentado; FDB no en git | OK | `inventario-fdb.md` |
| 1 | `.gitignore` FDB/extractos/CSD | OK | 2026-08-31 |
| 1 | Copia tmp, no montar original en escritura | OK | `tmp/pdv-eleventa/PDVDATA.FDB` |
| 1 | Docker FB 2.5 abre + COUNT = exportadas | **PASS** | Colima + FB 2.5 i386. 685 = `pdv-extract.json`. 64-bit rechaza ODS 10.1 Win32. |
| 1 | `npm run test:064` | **PASS 17/17** | 100→116, redondeo, 0, null; KTZ/VAC/BACO/EXAM; dry-run |
| 2 | Duplicados / costo≥neta / kits huérfanos / IVA / clasificación | **PASS** | samples + extract 685 |
| 2 | Cero writes `katzen-a0e3e` | OK | no se intentó |
| 3 | Emulador N vs N, sample, valuación, deny-list | **PASS** | 685=685; 159 fuera de POS; 0 costo≥precio vendible |
| 3 | Prod catálogo + stock | **PASS 2026-09-01** | Backup + import `katzen-a0e3e`. No hosting / functions / rules. Spec **no** done (kits explode, historial, freeze). |
| 4 | QA guía POS + unitarios + build + :4200 | pendiente | specs hijas no paran datos |
| 5 | N tickets vs N importados; suma líneas; no CxC fantasma | pendiente | |
| 6 | Checklist freeze; agente no apaga Windows | pendiente | Luis en clínica |

### Checklist pre-entrega (entrega actual: docs + utils + extractor)

- [x] Decisiones en spec / plan / tasks / canvas
- [x] Contratos RTDB + mitigación en `plan.md`
- [x] Guía QA UI — N/A (sin UI nueva)
- [x] `npm run test:064` — **17/17 PASS** (ChromeHeadless, 2026-08-31)
- [x] `npm run build` — **exit 0** (budget inicial 2.37 MB, warning preexistente)
- [x] Live preview — N/A utils (sin cambio de pantalla)
- [x] Chips / 059 / 061 — N/A
- [x] Loading — N/A
- [x] PII / CSD — no se copió FDB al repo; no se exportaron certificados
- [x] Write producción catálogo — **hecho 2026-09-01** (autorizó Luis Alfonso Niño Martínez). Spec no done.

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios / UI / loading / 059 / 061 | N/A | sin UI |
| IVA 100→116, redondeo, 0, null | PASS | `pdv-iva-map.util.spec.ts` |
| Clasificación KTZ/VAC/BACO/EXAM/kit/baño/servicio | PASS | samples inventario-fdb |
| Dry-run duplicados / costo / kits huérfanos | PASS | |
| Docker Firebird 2.5 i386 | PASS | Colima; COUNT = extract |
| Copia FDB tmp | OK | gitignored |
| Build `npm run build` | PASS exit 0 | warning budget 2.37 MB (preexistente) |
| Write producción catálogo | **PASS 2026-09-01** | ver evidencia import prod abajo |
| UI catálogo: doble clic abre ficha (grid + lista) | PASS 2026-09-01 | Atajo al `ProductoDialog` existente. `npm run build` exit 0. Smoke localhost `:4200/admin/inventario/productos` (529 cards emulador): dblclick cuadrícula y lista abren «Editar producto» con stock mín. y precio. Sin spec nueva. Sin deploy. |

```
npm run test:064 → 37/37 SUCCESS (Chrome Headless)
npm run build    → exit 0 (budget warning 2.38 MB preexistente)
extract          → 685 productos
import-emulator  → reportes CSV + GATE N=N 685 en emulador :9000 (demo-katzen-pdv)
import-prod      → GATE N=N 685 en katzen-a0e3e (2026-09-01; OK Luis)
```

### Evidencia import prod (2026-09-01)

Autorización explícita de Luis Alfonso Niño Martínez: ver el catálogo eleventa en producción.

| Dato | Valor |
|------|--------|
| Backup (antes de writes) | `tmp/pdv-eleventa/backup-prod-inventario-2026-09-01T07-28-45.json` (gitignored). Previo: 16 productos (E2E + `fdsfs`), 1 `ServiciosClinica` (Consulta General). Copia CLI extra: `backup-prod-inventario-20260901-012717-*.json` |
| N extract vs N escritas | **685 = 685** (0 upsert; códigos E2E / `34234` no coinciden → se dejaron, no se borraron) |
| Total `Inventario/Productos` | 701 (685 eleventa + 16 previos) |
| Listado activo (`activo !== false`) | 529 = 526 visibles POS + 3 previos activos (2 E2E + `fdsfs`) |
| Uso interno | **159** `activo: false` — **no salen** en `/admin/inventario/productos` |
| Sample vs extract | V003 Bordetella **290** / stock 30; BACO001 **232** / stock 0; KTZ056 **1502.20** BOM `V002=3;V003=1;V004=1` |
| Map / baños / servicios | `PdvCodigoMap` 685; `PdvEnlacesBaco` 18; `ServiciosClinica` 18 eleventa + Consulta General intacta |
| Deny-list | `Katzen/Producto` y `Katzen/Productos` (móvil) **no escritos**. CSD / FACTURACION no tocados. |
| Hosting | **no** desplegado (`useRtdbEmulator: false` ya en prod; el admin lee RTDB) |
| Functions / database / storage | **no** |
| URL | https://katzen-a0e3e.web.app/admin/inventario/productos |

Resultado JSON: `tmp/pdv-eleventa/import-prod-result.json`. Script: `PDV_RTDB_TARGET=prod PDV_CONFIRM_PROD=LUIS node scripts/pdv-eleventa/import-prod.mjs`.

Destinos import: anaquel 466, vacuna 14, baño 18, servicio 5, examen 13, kit 10, uso_interno 159.

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-004 (fase 0)
- [x] SC-008b tests IVA/clasificación presentes (gate 1 código)
- [x] SC-005 extract SQL real (catálogo 685 = JSON)
- [ ] SC-006 … SC-025 fases 3–6 restantes

---

## Cierre

- [ ] Validación pre-entrega completa del **módulo entero** — no hasta fases 1–6 + QA
- [ ] `spec.md` estado → `done` — **no** (sigue in_progress)
- [ ] Commit / deploy — **no** salvo que Luis lo pida

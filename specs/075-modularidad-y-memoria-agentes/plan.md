# Plan técnico: Modularidad y memoria agentes

**Spec:** `specs/075-modularidad-y-memoria-agentes/spec.md`  
**Estado:** approved (alcance docs + cortes seguros)  
**Nivel:** L2 (plan presente para **contratos de módulos compartidos**, no L3 RTDB)

---

## Resumen

Prioridad 1: memoria operativa para agentes (`agent-guardrails`, `module-map`, hooks en AGENTS/SDD).  
Prioridad 2: modularización **incremental** — barrel `core/utils` + extracto de copy puro del POS (`pos-copy.util.ts`) sin tocar contrato RTDB ni reescribir diálogos.

---

## Contratos de módulos compartidos (límites)

| Módulo lógico | Puede importar | No debe |
|---------------|----------------|---------|
| **Landing** | `core` mínimo, shared types | Servicios admin, portal layout |
| **Admin feature** (`visitas`, `clientes`, …) | `core`, `shared`, otros servicios admin vía DI | Shells portal, write “como client” |
| **Portal** | `core/utils` puros, servicios portal | Diálogos admin, `VisitasService` write |
| **Core** | Angular/Firebase base | Componentes de feature |
| **Shared UI** | Material, tokens admin | Lógica de cobro / rules |
| **Inventario** | shared inventario models, finanzas solo lectura/link | Portal |
| **Visitas (POS)** | inventario, caja, clientes/pacientes pickers | Portal agenda |
| **Finanzas** | Caja/Finanzas nodos | Mutar stock sin movimiento inventario |

Documentación viva: `specs/memory/module-map.md`.

---

## Archivos a crear / modificar

### Docs

| Archivo | Acción |
|---------|--------|
| `specs/memory/agent-guardrails.md` | crear |
| `specs/memory/module-map.md` | crear |
| `specs/075-…/spec.md`, `tasks.md`, `plan.md` | crear |
| `AGENTS.md`, `sdd-workflow.mdc`, `specs/README.md` | actualizar hooks |
| `specs/ROADMAP.md`, `PLAN-UX-VETERINARIAS.md` | línea 075 |
| `specs/memory/domain-context.md` | alinear Resend (activado) |

### Código (bajo riesgo)

| Archivo | Acción |
|---------|--------|
| `src/app/core/utils/index.ts` | barrel documentado |
| `src/app/visitas/pos-copy.util.ts` (+ `.spec.ts`) | extracto `mensajeRequiereClientePara` + `origenLineaHint` |
| `src/app/visitas/visita-dialog.component.ts` | usar util |

---

## Fases siguientes (no en esta entrega)

1. ~~Extraer sub-pasos del wizard POS / sheets a componentes o facades con tests.~~ → **076** wizard/bloqueo; **077** `pos-sheet.util` (estado/validación sheets).
2. ~~Partir `pacientes.component` en tabs/paneles lazy.~~ → **077** fecha/edad/timeline; **079** `matTabContent` en expediente.
3. Evaluar `NgModule` boundaries más estrictos (SharedAdminModule vs PortalShared) solo si el build lo soporta sin churn.
4. ~~Unificar formatters de fecha portal/admin **si** aparece tercer duplicado.~~ → **parcial en 076**: `formatMoneyMx` migrado en visita-dialog + cliente-cuenta (+ caja-corte); fechas portal aún pendientes.
5. ~~Sheets POS (`producto`/`línea`/`scanner`) → componente/facade (oleada 3).~~ → **077** facade util; UI sigue en diálogo (sin rewrite).
6. ~~Orquestación async guardar/cobrar (oleada 4).~~ → **079** `pos-orquestacion.util`.
7. ~~Extraer `persistir` + salidas kit/stock (oleada 5).~~ → **080** `pos-persistir.util`.
8. ~~Sheets POS como componentes (oleada 6).~~ → **081** panel/cantidad/scanner; carrito aún inline.

Ver detalle: `specs/076-modularizacion-pos-core/` · `specs/077-modularizacion-pos-pacientes/` · `specs/079-modularizacion-pos-orquestacion/` · `specs/080-modularizacion-pos-persistir/` · `specs/081-modularizacion-pos-sheets/`.

---

## Plan de Mitigación y Rollback

| Riesgo | Mitigación | Rollback |
|--------|------------|----------|
| Copy POS cambia semántica | Tests con strings actuales | Revertir `pos-copy.util` + imports |
| Barrel rompe tree-shaking | Solo re-export; imports existentes no obligados a barrel | Borrar `index.ts` |
| Docs contradicen dominio | Guardrails apunta a specs canónicas | Ajustar párrafo, no borrar specs |

---

## Testing

- Unit: `pos-copy.util.spec.ts`
- `npm run lint` (0 errores)
- `npm run build` exit 0

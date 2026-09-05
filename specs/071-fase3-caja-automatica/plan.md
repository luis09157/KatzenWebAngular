# Plan técnico: Fase 3 — Caja automática

**Spec:** `specs/071-fase3-caja-automatica/spec.md`  
**Estado:** approved  
**Constitución / dominio:** leídos 2026-09-04 — RTDB **aditivo**; no prod; no romper móvil.

---

## Resumen

Abrir turno en el primer cobro del día (nodo `Katzen/Caja/Turnos/{fecha}`), avisar el corte en POS/Hoy, imprimir ticket 80 mm alineado al WhatsApp 065, mostrar ventas por veterinaria + atajo CxC en Finanzas, y exportar OC a CSV. Sin Cloud Functions. Rules solo índice aditivo bajo `Caja` (el padre ya restringe write a staff).

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/finanzas/caja.models.ts` | modificar | `CajaTurno` |
| `src/app/finanzas/caja-turno.util.ts` + spec | crear | banner, fondo, corte duplicado |
| `src/app/finanzas/caja.service.ts` | modificar | turno, cortes, `asegurarTurnoDelDia` |
| `src/app/finanzas/caja-corte-dialog.*` | modificar | efectivo contado principal; bloqueo 2.º corte |
| `src/app/finanzas/caja-corte-banner.component.*` | crear | CTA reutilizable |
| `src/app/finanzas/caja-dialog.module.ts` | modificar | exporta corte + banner |
| `src/app/finanzas/finanzas.module.ts` | modificar | deja de declarar el diálogo de corte |
| `src/app/finanzas/finanzas.component.*` | modificar | tab ventas hoy + CxC |
| `src/app/finanzas/ventas-por-veterinaria.util.ts` + spec | crear | agrupación |
| `src/app/visitas/visitas.models.ts` | modificar | `folio?` |
| `src/app/visitas/visitas.service.ts` | modificar | asignar folio al cobrar |
| `src/app/visitas/folio-ticket-visita.util.ts` + spec | crear | `KV-YYYYMMDD-NNN` |
| `src/app/visitas/ticket-80mm.util.ts` + spec | crear | view-model print = WhatsApp |
| `src/app/visitas/pos-ticket-whatsapp.util.ts` | modificar | `folio?` explícito |
| `src/app/visitas/visita-dialog.*` | modificar | print `ticket-80`, folio, cambio |
| `src/app/visitas/visitas.component.*` + module | modificar | banner |
| `src/app/dashboard/dashboard.component.*` + module | modificar | banner |
| `src/app/clientes/clientes.component.ts` | modificar | `?deuda=1` |
| `src/app/inventario/ordenes/orden-compra-csv.util.ts` + spec | crear | filas CSV |
| `src/app/inventario/ordenes/ordenes.component.ts` | modificar | export real |

### Firebase

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | índice aditivo `Caja/Turnos` |
| Cloud Functions | ninguna |

### Cypress

| Archivo | Acción |
|---------|--------|
| — | sin ruta nueva |

---

## Modelo de datos

```text
Katzen/Caja/Turnos/{YYYY-MM-DD}     # clave = fecha local clínica
  abiertaEn: string                 # ISO
  fondoInicial: number              # último corte.efectivoContado o 0
  corteId?: string                  # set al guardar corte
  createdBy?: string
  sucursalId?: string               # opcional, no exigido

Katzen/Caja/Cortes/{id}             # sin cambio de forma (064)
  fecha, fondoInicial, esperado, efectivoContado, diferencia, ...

Katzen/Visitas/{id}
  folio?: string                    # KV-20260904-001 — aditivo
  atendidoPorNombre?: string        # ya existía (035)
```

App móvil: no lee `Turnos` ni `folio`. Campos opcionales; defaults seguros (sin turno = cobro igual; sin folio = folio corto del id).

---

## Flujos

### Flujo principal — cobro → turno

1. POS / caja registra un **ingreso** (`CajaService.crearMovimiento`).
2. Tras el push, `asegurarTurnoDelDia(fecha)`: si no hay nodo, escribe turno con fondo del último corte (o 0).
3. Si ya existe turno, no se pisa `abiertaEn` / `fondoInicial`.
4. Al cobrar visita se asigna `folio` si falta (`siguienteFolioTicketDia`).

### Flujo corte

1. Banner visible si `debeMostrarBannerCorte` (turno abierto, sin corte, y ≥18:00 o hubo ventas).
2. CTA abre `CajaCorteDialog` con movimientos del día y fondo del turno.
3. `guardarCorte` rechaza si ya hay corte activo de esa fecha.
4. Éxito → `corteId` en el turno.

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Segundo corte el mismo día | «Ya hay un corte de este día» |
| Turno no se pudo escribir | no bloquea el cobro (log + cobro sigue) |
| OC sin filas | «No hay órdenes para exportar» |
| Sin permiso RTDB | `ErrorMessagesService` contexto existente |

---

## Servicios

- `CajaService` — `getTurno`, `getCortes`, `asegurarTurnoDelDia`, `marcarCorteEnTurno`, `guardarCorte` (guarda + anti-duplicado)
- `VisitasService` — `asignarFolioSiFalta`
- Utils puros: turno, folio, ticket 80 mm, ventas/vet, CSV OC

---

## UI (admin)

- Banner compacto `app-caja-corte-banner` (POS + Hoy)
- Diálogo corte: `admin-dialog-shell`; efectivo contado destacado
- Print: solo `.ticket-80` (clase de inspección)
- Finanzas: tab «Ventas hoy» + card CxC
- OC: mismo botón Exportar → CSV

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Caja/Turnos/{fecha}` | nodo nuevo | no | no lo consume móvil |
  | `Katzen/Caja` rules `Turnos.indexOn` | aditivo | no | padre ya es staff-only write |
  | `Katzen/Visitas.folio?` | campo opcional | no | lectura ignora si falta |
  | `Katzen/Caja/Cortes` | sin rename | no | solo guardia en cliente |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** emulador RTDB (`useRtdbEmulator: true`) + unit tests. Prohibido prod.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Diálogo | `admin-dialog-shell`, `ADMIN_DIALOG_CONFIG` |
  | Alertas / errores | `ErrorMessagesService`, SweetAlert2 |
  | Loading async | `LoadingService` + `hide` en `finally` |
  | Tabla | `.table-scroll` + `mat-table` |
  | CSV | `src/app/core/utils/csv-export.util.ts` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips/badges de estado visibles enteros (no truncados)

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Rules RTDB incorrectas | Revertir el bloque `Turnos` en `database.rules.json`. **No** `firebase deploy --only database` sin Luis. Si ya se desplegó: redeploy del JSON anterior (autorización Luis). |
| Nodo `Turnos` con datos basura | Borrar `Katzen/Caja/Turnos` (o solo `{fecha}`) en emulador /, en prod, **solo Luis**. No toca `Movimientos` ni `Cortes`. |
| `folio` mal generado | Quitar el campo de esas visitas (opcional) o dejarlo; la UI cae al folio corto del id. |
| UI rompe POS / print / WhatsApp | Revertir archivos de `visitas/` y `pos-ticket-whatsapp.util.ts`. |
| Banner o corte bloquea cobro | El cobro no depende del banner; `asegurarTurnoDelDia` no debe fallar el ingreso (try/catch). |

**Rollback mínimo (sin deploy):** revertir commit/archivos de 071. El nodo `Turnos` huérfano no rompe móvil ni cobros.

**Rollback con rules ya en prod (solo Luis):**

```bash
# 1) Quitar "Turnos" de database.rules.json y redeploy database (Luis)
# 2) Opcional: borrar Katzen/Caja/Turnos en consola RTDB
# 3) Redeploy hosting de un commit anterior (spec 063: no hay historial Hosting)
```

---

## Deploy

**No ejecutar en esta entrega.** Cuando Luis autorice:

```bash
npm run build
# rules nuevas:
firebase deploy --only database
# UI:
firebase deploy --only hosting
# hosting: retainedReleaseCount 1; borrar versiones anteriores (063)
```

Functions: no aplica.

---

## Riesgos

- Emulador con rules viejas: `Turnos` igual es escribible (padre `Caja.write` staff).
- Dos cobros simultáneos: carrera al crear turno; última escritura gana, misma fecha. Aceptable en mostrador único.
- Banner visible todo el día tras la primera venta (interpretación literal del plan UX). Es compacto y se oculta al cortar.
- Impresora real 80 mm no se valida aquí.

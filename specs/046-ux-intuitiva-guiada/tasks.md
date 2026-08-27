# Tasks: UX intuitiva guiada (046)

**Estado:** in_progress  
**Spec:** `specs/046-ux-intuitiva-guiada/spec.md`

---

## Documentación

- [x] T-001: `spec.md` con principios + US + walk-in
- [x] T-002: `plan.md` contratos + decisión walk-in A/B
- [x] T-003: Enlace en `specs/README.md` y `ROADMAP.md`
- [x] T-004: Sección UX en `specs/memory/domain-context.md`
- [x] T-005: Alinear copy/renombres en `specs/045-visita-hub-pos-grid/spec.md`
- [x] T-006: Matriz transversal todos los módulos en `spec.md`

## Ola 1 — Cuenta del día (junto con 045)

- [x] T-010: Hints “te falta dueño” / “agrega líneas” / Cobrar deshabilitado explicado
- [x] T-011: Empty state líneas (+ pendientes baño parcial en código) — empty copy OK en QA
- [x] T-012: Producto = picker + cantidad (verificado en browser 2026-08-27)
- [x] T-013: Chips o subtítulo de pasos (Dueño → Líneas → Cobrar) — subtítulo + hints
- [x] T-014: Copy “Cuenta del día” en menú, banner y diálogo

## Ola 2 — Walk-in petshop

- [x] T-020: Modo “Venta de mostrador” (`esMostrador` + `cliente_id` `__mostrador__`)
- [x] T-021: CTA “¿Es cliente? Vincular” sin bloquear cobro
- [x] T-022: Salida inventario + caja (clienteId omitido en mostrador; CxC no sync)

## Ola 3 — Guías en módulos operativos

- [x] T-030: Baño: hint dueño + banner/empty alineados a Cuenta del día
- [x] T-031: Empty states cuenta del día + productos + movimientos + peluquería/citas/vacunas/historiales
- [x] T-033: Copy global menús/Swal: «Agregar a cuenta» / «Cobra desde Cuenta del día» (ola copy)
- [ ] T-032: (Opcional) helper `flow-hint` reutilizable

## Testing y validación exhaustiva

> Baseline QA + fix hallazgos + walk-in + **ola copy/guías** · 2026-08-27 · `http://localhost:4200`

| Ítem | Resultado | Notas |
|------|-----------|-------|
| Copy Cuenta del día en menús/Swal | **PASS** | baños/citas/vacunas/pensión/clientes/expediente |
| Baño hint dueño | **PASS** | |
| Empty Proveedores / OC / Alertas / Reportes | **PASS** | copy guiada + CTA |
| `npm run build` | **PASS** | post ola inventario |
| Preview `:4200` | **PASS** | |
| Deploy hosting | **PASS** | https://katzen-a0e3e.web.app |
| Responsividad global (ola CSS) | **PASS** | sidebar scroll; gutters; grid productos compacto; paneles/diálogos ≤900/640; `npm run build` OK |
| Deploy hosting (CSS responsive) | **PASS** | 2026-08-27 https://katzen-a0e3e.web.app |
| Tabla clientes legible | **PASS** | min-width 1280 + acciones 200px (5 icons); headers/tel/correo sin clip; scroll-x |
| Preview `:4200` post-CSS | **PASS** | live reload |

### Hallazgos UX prioritarios (para olas)

1. Menú **“Visitas / tickets”** no dice “Cuenta del día” — confunde (046 P6).
2. Ticket: Guardar/Cobrar disabled sin texto “elige dueño primero”.
3. Lista tickets vacía: sin `app-admin-empty-state` + CTA.
4. Productos: falta vista cuadrícula (045).
5. Movimientos empty: copy OK pero sin botón CTA en el empty.
6. Finanzas empty: tiene “Registrar cobro” en empty — buen patrón a copiar.

---

## QA transversal módulos (baseline 2026-08-27)

| Módulo | Carga OK | Empty/copy claro | Guía te-falta-X | Notas UX |
|--------|----------|------------------|-----------------|----------|
| Inicio | OK | OK (KPIs explican) | N/A | Dashboard claro |
| Clientes | OK | Parcial | Parcial | CTA Nuevo sí |
| Buscar paciente | OK | — | — | Sin CTA “nuevo” (esperado) |
| Pacientes | OK | Parcial | Parcial | CTA sí |
| Citas | OK | Parcial | Parcial | CTA sí |
| Historiales | OK | Parcial | Parcial | CTA sí |
| Vacunas | OK | Parcial | Parcial | CTA sí |
| Recordatorios | OK | **OK** | Parcial | Empty + “Agregar primer recordatorio” |
| Peluquería | OK | Parcial | **OK** en diálogo | “Primero elige un cliente” |
| Visitas | OK | Parcial (tabla) | Parcial | Hub 045 en progreso; picker producto OK |
| Finanzas | OK | **OK** | Parcial | Empty con CTA cobro |
| Productos | OK | Parcial | N/A | Thumbs sí; **sin grid toggle** |
| Movimientos | OK | OK texto | — | Empty sin botón CTA |
| Proveedores | — | — | — | No auditado en esta pasada |
| OC | — | — | — | No auditado en esta pasada |
| Alertas | — | — | — | No auditado en esta pasada |
| Reportes | — | — | — | No auditado en esta pasada |
| Pensión | OK | Parcial | Parcial | CTA sí |
| Consentimientos | OK | Parcial | Parcial | CTA sí |
| Usuarios | OK | Parcial | Parcial | CTA sí |
| Landing | OK | OK | N/A | Hero + portal + staff |
| Portal (dual) | OK | OK | N/A | Selector contexto claro |

---

## Definition of Done (checklist)

- [ ] Ola acordada con Luis implementada
- [ ] Build OK + QA tabla arriba (baseline hecho; olas pendientes)
- [ ] `spec.md` → `done` solo tras QA de ola cerrada

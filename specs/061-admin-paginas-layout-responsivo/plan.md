# Plan técnico: Layout responsivo de páginas admin

**Spec:** `specs/061-admin-paginas-layout-responsivo/spec.md`  
**Estado:** approved  

---

## Resumen

CSS canónico: `.admin-content` se declara **container** (`container-name: admin-page`) para que grids, KPIs y hubs respondan al **ancho útil** (después del sidenav), no al viewport. El expediente de pacientes pasa a grid fluido 3→2→1; banner/toolbars wrapean alineados al inicio; buscador+Nuevo se apilan en estrecho; padding DUEÑO y gap de timeline se corrigen en el componente. Misma regla en KPI grid, dashboard hub y POS home. Sin RTDB, sin diálogos 059.

---

## Archivos a crear / modificar

### Angular / CSS

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/styles/katzen-tokens.css` | modificar | tokens `--admin-gap-card`, `--admin-pad-card` |
| `src/styles/admin-crud.scss` | modificar | `container-type` en `.admin-content`; stats grid con CQ |
| `src/styles/admin-page-layout.scss` | modificar | toolbars wrap, split search+acción, gap cards |
| `src/app/shared/admin/admin-kpi-grid.component.ts` | modificar | 4→2→1 por container, no viewport |
| `src/app/shared/admin/admin-page-banner.component.scss` | modificar | wrap alineado; aire bajo acciones |
| `src/app/pacientes/pacientes.component.scss` | modificar | expediente fluido; dueño padding; timeline gap |
| `src/app/pacientes/pacientes.component.html` | modificar | tooltip `below` en acciones del banner |
| `src/app/pacientes/banios-paciente.component.scss` | modificar | search no clip; stack en columna estrecha |
| `src/app/pacientes/banios-paciente.component.html` | modificar | `subscriptSizing="dynamic"` en buscador |
| `src/app/dashboard/dashboard.component.css` | modificar | hub tiles y mid-grid por container |
| `src/app/visitas/visitas.component.scss` | modificar | POS tiles 3-col solo si el útil lo aguanta |

### Docs / reglas

| Archivo | Acción |
|---------|--------|
| `docs/ADMIN-UI-ARCHITECTURE.md` | regla 13 páginas admin |
| `.cursor/rules/admin-ui-architecture.mdc` | never-violate 13 |
| `specs/templates/qa-validation-guide.md` | §2.6 + checklist 375/768/1280 |
| `.cursor/rules/sdd-workflow.mdc` | pre-entrega spec 061 |
| `AGENTS.md` | una línea UI |
| `specs/README.md` | índice 061 |
| `specs/memory/constitution.md` | bullet UI páginas |

### Firebase / Cypress

Ninguno. Sin callables ni reglas. Cypress no obligatorio (solo CSS); smoke visual localhost.

---

## Modelo de datos

Sin cambios. No se tocan nodos RTDB.

---

## Flujos

### Flujo principal

1. Staff abre expediente (Oreon) o cualquier página `.admin-page`.
2. El layout mide `.admin-content` (container) y elige 3, 2 o 1 columna.
3. Toolbars wrapean; buscador no recorta; cards tienen padding.

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| N/A (solo CSS) | — |
| Smoke sin sesión staff | spec permanece `in_progress`; no inventar credenciales |

---

## Servicios

Ninguno nuevo. `LoadingService` no se toca.

---

## UI (admin)

- Contenedor: `.admin-content` → `container-name: admin-page`
- Expediente: `.expediente-layout` + nested container `.expediente-main`
- Banner: `.banner-actions` flex-wrap + `justify-content: flex-start`
- Split search: `.tab-panel__toolbar--split` / `.admin-split-toolbar`

### Breakpoints de contenido útil (guía)

| Ancho `.admin-content` (content box) | Layout típico |
|--------------------------------------|---------------|
| ≥ 1100px | 3 columnas si el diseño las pide |
| 720–1099px | 2 columnas |
| &lt; 720px | 1 columna (stack) |

El sidenav (~280px) **no** entra en esta medida: por eso no se usa solo `@media (min-width: 1200px)` de viewport.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno. Solo CSS/HTML de páginas y documentación. App móvil no afectada.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | — | ninguna | no | sin contrato |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura (N/A)

- **Estrategia de Datos de Prueba:** localhost `:4200`. Mocks si aplica. **Prohibido** RTDB producción y credenciales `katzen-a0e3e`. Si el expediente requiere login staff y no hay sesión, anotar blocker; no fabricar usuarios.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Página CRUD | `src/app/clientes/` |
  | Shell admin | `.admin-page`, `admin-page-layout.scss` |
  | KPI | `app-admin-kpi-grid` |
  | Banner acciones | `app-admin-page-banner` |
  | Panel + search | `app-admin-data-panel`, `.panel-search` |
  | Diálogos | **no tocar** (059) |
  | Loading | sin cambios |
  | Badges / nombres tabla | reglas 5–6 vigentes |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips/badges de estado visibles enteros (no truncados)

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado en caso de fallos inesperados.

| Escenario | Acción de rollback |
|-----------|-------------------|
| CSS rompe un módulo | Revertir el SCSS del componente / `admin-page-layout.scss` |
| Container queries no aplican | El default es 1 columna (mobile-first); no hay pantalla en blanco |
| Build falla | Revertir archivos de esta spec; no hay functions |
| UI de diálogo 059 rota | Esta spec no toca `admin-dialog.scss`; si se tocó por error, revertir |

---

## Deploy

```bash
npm run build
# hosting solo si Luis lo pide — no firebase deploy en esta entrega
```

Sin functions ni `database.rules.json`.

---

## Riesgos

- Container queries ignoradas en navegadores muy viejos → fallback 1 columna (aceptable).
- `::ng-deep` residual en pacientes: no ampliar; preferir estilos del propio componente.
- Encapsulación de `banios-paciente` pisa `.panel-search` global: corregir ahí, no con `!important` sueltos en otros módulos.
- No subir el breakpoint de 3 columnas tanto que un 27" quede en 2 cols (regla 9).

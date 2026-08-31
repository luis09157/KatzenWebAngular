# Plan técnico: Layout responsivo de diálogos admin

**Spec:** `specs/059-dialogos-admin-layout-responsivo/spec.md`  
**Estado:** approved  

---

## Resumen

Corregir el CSS global de overlays (`admin-dialog.scss`) para que `.entity-summary` no quite el padding del body, compactar el hero, y forzar tabs Material visibles. Auditar diálogos con el mismo patrón y documentar la regla en arquitectura, Cursor rules y guía QA. Sin cambios RTDB ni de negocio.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/styles/admin-dialog.scss` | modificar | quitar `:has(.entity-summary)`; tabs overlay; compactar hero |
| `src/app/pacientes/pacientes.component.scss` | modificar | tabs expediente `overflow`/`height` |
| `src/app/pacientes/pacientes.component.html` | modificar | `dynamicHeight` en expediente |
| `src/app/usuarios/usuarios.component.css` | modificar | `height: auto` en tabs |
| `src/app/finanzas/finanzas.component.scss` | modificar | `height: auto` en tabs |
| `src/app/*/*-dialog*.scss` / `*-detalle*.scss` | modificar | compactar `.entity-summary` 16/12; acotar selector leak en paciente-admin |
| `src/app/core/config/admin-ui.config.ts` | no | `ADMIN_DIALOG_FICHA` ya existe (058) |

### Firebase

Ninguno.

### Cypress

Ninguno (sin ruta nueva). Smoke visual local.

### Specs / reglas

| Archivo | Acción |
|---------|--------|
| `specs/059-dialogos-admin-layout-responsivo/*` | crear |
| `docs/ADMIN-UI-ARCHITECTURE.md` | regla 12 + sección diálogos |
| `.cursor/rules/admin-ui-architecture.mdc` | regla 12, alwaysApply |
| `.cursor/rules/sdd-workflow.mdc` | bullet pre-entrega 059 |
| `specs/templates/qa-validation-guide.md` | §2.5 |
| `specs/templates/module-tasks.template.md` | fila QA 059 |
| `specs/README.md` | índice 059 |
| `AGENTS.md` | línea UI Admin |
| `specs/058-ficha-directorio-dblclick/spec.md` | nota → 059 |

---

## Modelo de datos

Sin cambios. No se leen ni escriben nodos RTDB nuevos.

---

## Flujos

### Flujo principal

1. Staff abre un diálogo admin (CRUD, detalle o ficha).
2. El body conserva padding salvo que el layout interno ya lo tenga.
3. Si hay tabs, el contenido es visible y el body scrollea.
4. En ~375px, dueño/meta se apilan.

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| N/A (solo CSS) | — |

---

## Servicios

Ninguno nuevo.

---

## UI (admin)

- Shell: `admin-dialog-shell` + `panelClass: admin-dialog-panel`
- Ficha: `ADMIN_DIALOG_FICHA` + `admin-dialog-panel--ficha`
- Pickers: `admin-dialog-shell--picker`

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno. Confirmado: app móvil no afectada.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | — | ninguna | no | solo CSS/docs |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura (N/A)

- **Estrategia de Datos de Prueba:** Localhost + sesión staff o mocks. Prohibido RTDB producción (`katzen-a0e3e`).

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Diálogo detalle/edición | `admin-dialog-shell`, `ADMIN_DIALOG_*` |
  | Ficha | `ADMIN_DIALOG_FICHA`, `admin-dialog-panel--ficha` |
  | Hero | `.entity-summary` compacto |
  | Tabs | `mat-tab-group` + `dynamicHeight` |
  | Loading async | N/A (layout) |
  | Badges estado | `.estado-badge` / chips completos |

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
| UI rompe un diálogo (contenido pegado o doble padding) | revertir el bloque de `:has(...)` / compactación en `admin-dialog.scss` y el SCSS del componente |
| Tabs siguen colapsados | ajustar selectores `.mat-mdc-tab-body-*` o añadir `dynamicHeight` |
| Build falla | revertir archivos CSS/HTML de esta spec (sin tocar 058 de producto) |
| Cloud Function / reglas | N/A |

---

## Deploy

No aplica. Sin `firebase deploy`. Hosting solo si Luis lo pide después.

```bash
npm run build
npm start   # http://localhost:4200
```

---

## Riesgos

- Doble padding si un diálogo tenía `padding: 0` global **y** padding en el componente: al quitar `:has(.entity-summary)` algunos bodies recuperan 24×28; los que ya tienen `--padded` interno siguen en `padding: 0` por `:has(.admin-dialog-form--padded)`.
- Selectores sueltos `.admin-dialog-panel .entity-summary` en componentes con `encapsulation: None` (paciente-admin) filtraban a todos los diálogos — hay que acotarlos al host.

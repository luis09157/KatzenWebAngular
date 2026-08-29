# Plan técnico: Cierre realista KatzenVet Web

**Spec:** `specs/054-cierre-sistema/spec.md`  
**Estado:** approved  

---

## Resumen

Cierre = documento `CIERRE.md` + P0 de UX (menú compacto, labels directorio, wizard ticket). Desparasitación vive en **053**. Cero RTDB, cero Functions, cero deploy.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/core/config/staff-role.config.ts` | modificar | `STAFF_NAV_COMPACT` + `navModulesForStaffRole` |
| `src/app/core/config/staff-role.config.spec.ts` | crear | unit tests menú compacto |
| `src/app/layouts/admin-main-layout.component.ts` | modificar | sidenav usa nav compacto |
| `src/app/layouts/admin-main-layout.component.html` | modificar | label Directorio; ocultar métricas en compacto |
| `src/app/core/config/admin-route-labels.config.ts` | modificar | Directorio de pacientes |
| `src/app/core/config/admin-module-pages.config.ts` | modificar | copy directorio |
| `src/app/pacientes-admin/pacientes-admin.component.html` | modificar | banner + empty |
| `src/app/visitas/visita-dialog.component.ts/html/scss` | modificar | stepper 3 pasos |

### Firebase

Ninguno.

### Cypress

Sin ruta nueva. Smoke existente de visitas/pacientes sigue válido.

---

## Modelo de datos

Sin cambios.

---

## Flujos

1. Login recepción → sidenav corto.
2. Nueva cuenta → paso 1 dueño → paso 2 líneas → paso 3 cobrar.
3. `/admin/pacientes-admin` se llama Directorio; `/admin/paciente` sigue Expediente.

### Errores esperados

| Caso | Mensaje |
|------|---------|
| Paso 1 sin dueño ni mostrador | Hint + no avanza |
| Paso 3 sin líneas / sin saldo | Tooltips existentes `guardarBloqueoHint` / `cobrarBloqueoHint` |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | — | — | no | solo UI |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura (N/A)

- **Estrategia de Datos de Prueba:** mocks + localhost. Prohibido producción `katzen-a0e3e`.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia |
  |--------|------------|
  | Sidenav | `admin-main-layout` |
  | Diálogo ticket | `admin-dialog-shell` |
  | Hints | `app-flow-hint` |
  | Empty | `app-admin-empty-state` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips/badges visibles enteros

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Menú oculta de más | Revertir `STAFF_NAV_COMPACT` a `*` para recepción |
| Wizard confunde en edición | En edición iniciar en paso 2; botón “Ver todo” no hace falta si Atrás funciona |
| UI rompe build | Revertir archivos 054 (no tocar 053) |

---

## Deploy

No aplica. Luis no pidió commit/push/deploy.

---

## Riesgos

- Recepcionista que sí usa inventario: puede ir por URL `/admin/inventario` (011). Si Luis quiere **ocultar y bloquear**, eso es spec de ACL futura (rompe 011 — confirmar antes).

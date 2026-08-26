# Plan técnico: Loading contextual y overlay no trabado

**Spec:** `specs/005-loading-feedback-ux/spec.md`  
**Estado:** approved  

---

## Resumen

Extender `LoadingService` con mensaje contextual (`show(message?)`) y binding en el overlay de `app.component`. Corregir el doble `show()` en el flujo guardar cita (quitar show del diálogo; un solo show en el padre + `finally` → `hide()`). Documentar la regla en arquitectura admin, rules Cursor y plantillas QA.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/core/loading.service.ts` | modificar | `LOADING_MESSAGES`, `show(message?)`, `message` Observable |
| `src/app/app.component.html` | modificar | texto dinámico del overlay |
| `src/app/citas/cita-dialog.component.ts` | modificar | quitar `show()` al cerrar |
| `src/app/citas/citas.component.ts` | modificar | mensajes + `finally` → `hide()` |

### Docs / SDD

| Archivo | Acción |
|---------|--------|
| `specs/005-loading-feedback-ux/*` | crear |
| `docs/ADMIN-UI-ARCHITECTURE.md` | sección Loading |
| `.cursor/rules/admin-ui-architecture.mdc` | regla loading |
| `.cursor/rules/angular-firebase.mdc` | API LoadingService |
| `specs/templates/qa-validation-guide.md` | checklist overlay |
| `specs/templates/module-tasks.template.md` | ítem QA loading |
| `specs/memory/constitution.md` | principio loading |
| `specs/README.md` / `ROADMAP.md` | índice |

### Firebase

Ninguno.

---

## Modelo de datos

Sin cambios RTDB.

---

## Flujos

### Guardar cita (corregido)

1. Usuario confirma en `CitaDialogComponent` → `dialogRef.close(formValue)` **sin** `show()`
2. Padre en `afterClosed` → `show('Guardando…')` → `guardarCita`
3. `finally` → `hide()` siempre
4. Éxito → Swal éxito; error → Swal error

### Errores esperados

| Caso | Mensaje usuario |
|------|-----------------|
| Solape / validación servicio | `ErrorMessagesService` / Error lanzado |
| Contador loading desbalanceado | Evitado: un show / un hide con `finally` |

---

## Servicios

- `LoadingService` — overlay global + mensaje contextual
- `CitasService.guardarCita` — sin cambios de contrato

---

## UI (admin)

- Overlay: `.global-loading-overlay` / `.global-loading-text`
- Mensajes: `LOADING_MESSAGES` (`Cargando…`, `Guardando…`, `Eliminando…`, `Actualizando…`)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | — | — | no | solo Angular UI |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales — N/A

- **Estrategia de Datos de Prueba:** mocks / localhost; no producción.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Overlay global | `app.component.html` + `LoadingService` |
  | Alertas | SweetAlert2 + `ErrorMessagesService` |
  | Diálogo cita | `admin-dialog-shell` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` actualizado

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos en contratos de datos
- [x] Compilación local (`npm run build`)
- [x] Rollback: revertir archivos de `loading.service`, `app.component.html`, `citas/*` y docs de esta feature

| Escenario | Acción de rollback |
|-----------|-------------------|
| Overlay no muestra mensaje | Revertir binding en `app.component.html` |
| Contador sigue trabado | Verificar un solo `show` por operación; `hide` en `finally` |
| UI rompe build | Revertir commit / archivos de la feature |

---

## Deploy

Solo hosting si Luis autoriza (solo cambios frontend). Sin functions ni rules.

---

## Riesgos

- Otros módulos (historiales, vacunas, recordatorios) pueden tener el mismo patrón doble-show; documentado para migración incremental. Baños usa show en diálogo + hide en padre (balanceado) — no tocar en esta entrega.

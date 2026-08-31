# Tasks: Ficha rápida al doble clic (Directorio)

**Spec:** `specs/058-ficha-directorio-dblclick/spec.md`  
**Plan:** `specs/058-ficha-directorio-dblclick/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan con contratos y rollback

### Backend

- [x] Reglas RTDB: N/A
- [x] Cloud Function: N/A
- [x] `npm run functions:build` — N/A

### Frontend

- [x] `ADMIN_DIALOG_FICHA`
- [x] `PacienteFichaDialogComponent` (foto, dueño, tabs clínicas)
- [x] Directorio: dblclick / Enter / stopPropagation acciones
- [x] Clientes: dblclick / Enter → ficha existente
- [x] UI según `admin-ui-architecture`

### Integración

- [x] Convive con expediente `/admin/paciente?id=` (CTA)

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask). El usuario **no** es el QA por defecto.  
> Guía: `specs/templates/qa-validation-guide.md`

- [x] `npm run build` — exit 0
- [x] Servidor local activo (`npm start` → http://localhost:4200) + compile OK
- [x] Manual/código: dblclick abre ficha; icono carpeta sigue al expediente
- [x] Manual/código: clic en Editar/Borrar no abre ficha (`stopPropagation` + `esEventoDeAccion`)
- [x] Manual/código: Enter/Espacio en fila enfocada abre ficha
- [x] Manual/código clientes: dblclick abre detalle + mascotas (`verCliente`)

**Resultado:** OK (build 0; ng serve compiled pacientes-admin + clientes)

```
npm run build → exit 0 (2026-08-31T07:35:02Z) Hash f9473feb956aca69
ng serve → http://localhost:4200 compiled successfully (pacientes-admin 84.85 kB, clientes 36.61 kB)
```

---

## Testing y validación exhaustiva

> **Guía obligatoria:** `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + compile/smoke (login staff requerido para datos reales)
- [x] Tabla de resultados rellenada (abajo)
- [x] UI recientes verificadas si aplican (chips, `--picker`, loading, timepicker)

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** N/A (modal solo lectura)
- [x] **Tipos erróneos:** N/A
- [x] **Límites / desbordamiento:** `overflow-wrap: anywhere` en título clínico, dueño y notas
- [x] **Chips/badges de estado:** `.estado-badge` / `.tag` con `width: max-content` y `white-space: nowrap` en la ficha

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** `admin-dialog-shell` + `h2.admin-dialog-title` (sin `mat-dialog-title`); CTA navega
- [x] **Pickers compactos:** N/A
- [x] **Timepicker:** N/A
- [x] **Retroalimentación:** toast Swal si falla una sección clínica
- [x] **Loading contextual:** «Cargando expediente…» dentro del diálogo
- [x] **Loading no trabado:** sin `LoadingService.show` al abrir ficha
- [x] **Doble submit:** N/A solo lectura

### 3. Casos límite y errores de red

- [x] **Red lenta / sin conexión:** spinner en diálogo; error de sección no cierra el modal
- [x] **Datos nulos RTDB:** foto fallback, dueño/tel/correo opcionales, listas vacías con empty state

### 4. Integridad final

- [x] **`npm run build`** ejecutado — exit 0
- [x] **Servidor local :4200** activo + compile anotado
- [x] **Resultados registrados** en la tabla de abajo antes de cerrar la feature

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | N/A | ficha solo lectura |
| Formularios — tipos erróneos | N/A | |
| Formularios — límites texto | OK | wrap en notas/dueño |
| UI — chips estado completos | OK | badge + tags en ficha (estilos propios del overlay) |
| Modales — apertura/cierre | OK | shell + Cerrar + CTA |
| UI — diálogos --picker | N/A | ficha grande, no picker |
| UI — timepicker en campos hora | N/A | |
| UI — retroalimentación | OK | toast por sección clínica |
| UI — loading contextual | OK | Cargando expediente… interno |
| UI — loading no trabado | OK | no LoadingService al abrir |
| UI — doble submit | N/A | |
| Edge — red lenta/error | OK | secciones independientes |
| Edge — datos nulos RTDB | OK | N/P / empty states |
| Servidor local :4200 + smoke | OK | ng serve compiled; datos reales piden sesión staff |
| Build `npm run build` | OK | exit 0 |

```
Build at: 2026-08-31T07:35:02.373Z - Hash: f9473feb956aca69 - exit 0
ng serve compiled: pacientes-admin + clientes (2026-08-31T07:35:55Z)
Advertencia previa: budget initial 2.36 MB (ya existía; no introducida por esta spec)
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: modal ficha completa
- [x] SC-002: tabs Historial / Vacunas / Recordatorios
- [x] SC-003: CTA + icono expediente
- [x] SC-004: stopPropagation acciones
- [x] SC-005: Enter / Espacio
- [x] SC-006: clientes dblclick

---

## Cierre

- [x] Validación pre-entrega completa (agente; no delegada al usuario)
- [x] Validación exhaustiva completada y registrada (sección anterior)
- [x] `spec.md` estado → `done`
- [ ] Commit / deploy — solo si el usuario lo pidió

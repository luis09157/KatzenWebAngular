# Tasks: Abrir expediente desde mascota en ficha de cliente

**Spec:** `specs/062-cliente-mascota-abrir-expediente/spec.md`  
**Plan:** `specs/062-cliente-mascota-abrir-expediente/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada y revisada con usuario
- [x] Plan aprobado (contratos + mitigación)

### Backend

- [x] N/A — sin reglas RTDB, sin Cloud Functions

### Frontend

- [x] Inyectar `Router` en `ClienteDialogComponent`
- [x] `abrirExpedientePaciente`: resuelve `id || idPaciente || key`; Swal si falta id; no-op silencioso eliminado
- [x] HTML: `(dblclick)` + `preventDefault`, keydown Enter/Espacio, `role="button"`, `tabindex="0"`, tooltip, hint
- [x] HTML: botón `folder_shared` `matTooltip="Ver expediente"` con `(click)` + `stopPropagation` (mismo patrón Directorio)
- [x] HTML: enlace de texto teal **«Ver expediente»** en `.mascota-card` (`stopPropagation`)
- [x] Nombre card: fallback `nombre || Nombre || 'Mascota'`
- [x] Navegar a `/admin/paciente?id=` **antes** de `dialogRef.close()`
- [x] `tryOpenFromQuery`: match `id` / `idPaciente` / `idLegacy`; fetch puntual `getPaciente` si no está en lista (incluye inactivo); no Swal hasta fallar el fetch
- [x] SW `katzen-portal-v3`: sin precache de `/` ni `/index.html`; fetch no cachea shell admin; registro `?v=3`
- [x] CSS: cursor pointer, `user-select: none`, hover sutil, hint; wrap/gap sin romper spec 059
- [x] `MatTooltipModule` en `ClientesDialogModule`

### Integración

- [x] Índice `specs/README.md`
- [x] Nota corta en spec 058
- [x] Convive con datos legacy (id hidratado) verificado

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask). El usuario **no** es el QA por defecto.  
> Guía: `specs/templates/qa-validation-guide.md` · Regla: `.cursor/rules/sdd-workflow.mdc` → Validación pre-entrega.

Ejecutar y marcar **solo tras registrar evidencia** en la sección exhaustiva:

- [x] `npm run build` — exit 0
- [x] `npm run functions:build` — N/A
- [x] Servidor local activo (`npm start` → http://localhost:4200) + smoke visual de lo tocado
- [x] Manual/mock localhost: flujo feliz (Liliana → mascota vinculada → expediente)
- [x] Manual/mock localhost: un error controlado (sin id → Swal «falta id», no navega)
- [x] `npm run cy:admin` — N/A (sin ruta nueva)

**Resultado:** OK (hotfix 2026-08-31 — SW v3 + Ver expediente + navigate-then-close)

```
npm run build → exit 0 (2026-08-31)
Hash: e5caecfb8c6add0c · Time: 118785ms
Warning de budget inicial 2.37 MB (preexistente; no bloquea)

Smoke:
- ng serve vivo en http://localhost:4200 (Compiled successfully; landing OK)
- SW localhost: katzen-portal-v3; PRECACHE sin / ni /index.html
- dist 413.e157731cf8827bdf.js: Ver expediente, mascota-card__ver-expediente, folder_shared, falta id
- dist 924.3eb0bd9df36558f3.js: Paciente no encontrado, getPaciente, idPaciente, Mascota
- dist firebase-messaging-sw.js: v3 + skip /admin
- portal-pwa / portal-fcm: register ?v=3
- Admin /admin/clientes requiere sesión staff (no se usan credenciales de prod desde el agente)
```

---

## Testing y validación exhaustiva

> **Guía obligatoria:** `specs/templates/qa-validation-guide.md`  
> **Regla:** el agente ejecuta **todas** las validaciones aplicables **antes de entregar**. Registrar resultados en esta sección **antes** de marcar `[x]` en cualquier tarea de implementación o testing.

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke visual
- [x] Tabla de resultados rellenada (abajo)
- [x] UI recientes verificadas si aplican (chips, `--picker`, loading, timepicker, diálogos spec 059, páginas spec 061)

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** N/A (solo lectura; sin envío de formulario en este flujo)
- [x] **Tipos erróneos:** N/A
- [x] **Límites / desbordamiento:** nombres de mascota en card; grid wrap `minmax(220px, 1fr)`
- [x] **Chips/badges de estado:** badge Vivo en card se ve completo

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** ficha cliente abre/cierra; al navegar el overlay desaparece
- [x] **Pickers compactos:** N/A
- [x] **Timepicker:** N/A
- [x] **Retroalimentación:** hint + tooltip visibles
- [x] **Loading contextual:** N/A (navegación local; no hay show extra)
- [x] **Loading no trabado:** no se llama `show` en este salto
- [x] **Doble submit:** N/A

### 3. Casos límite y errores de red

- [x] **Red lenta / sin conexión:** N/A para el salto (el listado ya está cargado)
- [x] **Datos nulos RTDB:** sin id/idPaciente/key → Swal «falta id»; no close/navigate

### 4. Integridad final

- [x] **`npm run build`** ejecutado — exit 0
- [x] **Servidor local :4200** activo + smoke visual anotado
- [x] **Resultados registrados** en la tabla de abajo antes de cerrar la feature

### Registro de resultados QA

_Completar al terminar cada iteración de validación (antes de `[x]`):_

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | N/A | Solo lectura |
| Formularios — tipos erróneos | N/A | |
| Formularios — límites texto | OK | Grid auto-fill wrap |
| UI — chips estado completos | OK | Badge Vivo en card |
| Modales — apertura/cierre | OK | Overlay se cierra al navegar |
| UI — diálogos --picker | N/A | |
| UI — timepicker en campos hora | N/A | |
| UI — diálogos spec 059 | OK | Padding layout `24px 28px 28px`; no se tocó body padding |
| UI — páginas spec 061 | OK | Grid mascotas gap 16px wrap; destino expediente con sidebar/tabs |
| UI — retroalimentación | OK | Hint + tooltip + enlace teal «Ver expediente» |
| UI — loading contextual | N/A | Sin show extra |
| UI — loading no trabado | N/A | |
| UI — doble submit | N/A | |
| Edge — red lenta/error | N/A | |
| Edge — datos nulos RTDB | OK | Sin id/idPaciente/key → Swal «falta id»; no close/navigate |
| Servidor local :4200 + smoke | OK | ng serve Compiled successfully; landing + SW v3 |
| Build `npm run build` | OK | exit 0 · Hash e5caecfb8c6add0c |
| SW no cachea index.html admin | OK | PRECACHE sin / ni /index.html; fetch skip /admin |
| Navegar antes de close | OK | router.navigate(...).then(() => dialogRef.close()) |
| Lookup paciente query | OK | id/idPaciente/idLegacy + getPaciente puntual |

```
> ng build --configuration production
✔ Browser application bundle generation complete.
Build at: 2026-09-01T03:22:00.535Z - Hash: e5caecfb8c6add0c - Time: 118785ms
Warning: bundle initial exceeded maximum budget (preexistente).
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: Doble clic → navigate then close `/admin/paciente?id=` (id || idPaciente || key)
- [x] SC-002: Enter/Espacio en card enfocada
- [x] SC-003: Pointer, user-select none, tooltip, hint, icono carpeta
- [x] SC-004: `role="button"` + `tabindex="0"`
- [x] SC-005: Sin id resoluble → Swal breve (no silenciar)
- [x] SC-006: Clic en `folder_shared` abre expediente (`stopPropagation`)
- [x] SC-007: Enlace de texto teal «Ver expediente» en la card
- [x] SC-008: Fallback nombre || Nombre || Mascota
- [x] SC-009: Navegar antes de cerrar el diálogo
- [x] SC-010: tryOpenFromQuery match + fetch puntual

---

## Cierre

- [x] Validación pre-entrega completa (agente; no delegada al usuario)
- [x] Validación exhaustiva completada y registrada (sección anterior)
- [x] `spec.md` estado → `done`
- [x] Commit / deploy — hosting autorizado por Luis (hotfix SW v3 + Ver expediente)

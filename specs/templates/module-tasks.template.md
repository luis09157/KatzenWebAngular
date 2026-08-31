# Tasks: [Nombre de la feature]

**Spec:** `specs/NNN-nombre-feature/spec.md`  
**Plan:** `specs/NNN-nombre-feature/plan.md`  

---

## Implementación

### Setup

- [ ] Carpeta spec creada y revisada con usuario
- [ ] Plan aprobado

### Backend

- [ ] Reglas RTDB (si aplica)
- [ ] Cloud Function (si aplica)
- [ ] `npm run functions:build`
- [ ] Function desplegada (`firebase functions:list`)

### Frontend

- [ ] Módulo lazy + routing + StaffModule
- [ ] Servicio(s)
- [ ] Componente lista + diálogos
- [ ] ErrorMessagesService contextos nuevos
- [ ] UI según `admin-ui-architecture`

### Integración

- [ ] Menú admin (si aplica)
- [ ] Convive con datos legacy verificado

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask). El usuario **no** es el QA por defecto.  
> Guía: `specs/templates/qa-validation-guide.md` · Regla: `.cursor/rules/sdd-workflow.mdc` → Validación pre-entrega.

Ejecutar y marcar **solo tras registrar evidencia** en la sección exhaustiva:

- [ ] `npm run build` — exit 0
- [ ] `npm run functions:build` — si tocó functions
- [ ] Servidor local activo (`npm start` → http://localhost:4200) + smoke visual de lo tocado
- [ ] Manual/mock localhost: flujo feliz
- [ ] Manual/mock localhost: un error controlado (permiso / validación)
- [ ] `npm run cy:admin` — si cambió ruta admin
- [ ] E2E específico: `cypress/e2e/...` — si se añadió

**Resultado:** _pendiente / OK / fallos anotados abajo_

```
# pegar output relevante o enlazar CI
```

---

## Testing y validación exhaustiva

> **Guía obligatoria:** `specs/templates/qa-validation-guide.md`  
> **Regla:** el agente ejecuta **todas** las validaciones aplicables **antes de entregar**. Registrar resultados en esta sección **antes** de marcar `[x]` en cualquier tarea de implementación o testing.

### Checklist pre-entrega

- [ ] Guía QA completa aplicada (§1–§4)
- [ ] `npm run build` OK y reportado
- [ ] Live preview :4200 vivo + smoke visual
- [ ] Tabla de resultados rellenada (abajo)
- [ ] UI recientes verificadas si aplican (chips, `--picker`, loading, timepicker, diálogos spec 059)

### 1. Formularios y validaciones de entrada

- [ ] **Campos vacíos:** envío bloqueado + alertas visuales (bordes rojos, `mat-error`) en obligatorios
- [ ] **Tipos erróneos:** letras en numéricos, correo/teléfono inválidos, símbolos extraños — rechazados o sanitizados
- [ ] **Límites / desbordamiento:** textos largos en notas/diagnósticos no rompen layout responsivo
- [ ] **Chips/badges de estado:** se ven **completos** (no mochos / sin clip por overflow)

### 2. Interfaz, ventanas y modales

- [ ] **Diálogos:** abren y cierran limpiamente; sin scroll lock ni backdrop colgado
- [ ] **Pickers compactos:** usan `admin-dialog-shell--picker` cuando aplica (no CRUD grandes)
- [ ] **Timepicker:** campos de hora usan `app-timepicker-field` (no `type="time"` nativo)
- [ ] **Retroalimentación:** toasts/mensajes de éxito y error en tiempo y lugar correctos
- [ ] **Loading contextual:** overlay con «Cargando…» / «Guardando…» / «Eliminando…» / «Actualizando…» según la operación (`LoadingService`)
- [ ] **Loading no trabado:** overlay desaparece tras success **y** error (`finally`); sin doble `show` diálogo+padre
- [ ] **Doble submit:** botones de acción deshabilitados o en loading al primer clic

### 3. Casos límite y errores de red

- [ ] **Red lenta / sin conexión:** loading visible, error comprensible, sin registros duplicados
- [ ] **Datos nulos RTDB:** nodos `null`/`undefined` o parciales no colapsan la vista (sin TypeError)

### 4. Integridad final

- [ ] **`npm run build`** ejecutado — exit 0, sin errores de tipado (pegar resumen abajo)
- [ ] **Servidor local :4200** activo + smoke visual anotado
- [ ] **Resultados registrados** en la tabla de abajo antes de cerrar la feature

### Registro de resultados QA

_Completar al terminar cada iteración de validación (antes de `[x]`):_

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | pendiente | |
| Formularios — tipos erróneos | pendiente | |
| Formularios — límites texto | pendiente | |
| UI — chips estado completos | pendiente | |
| Modales — apertura/cierre | pendiente | |
| UI — diálogos --picker | pendiente | |
| UI — timepicker en campos hora | pendiente | |
| UI — diálogos spec 059 | pendiente | padding, tabs visibles, body scrollea |
| UI — retroalimentación | pendiente | |
| UI — loading contextual | pendiente | |
| UI — loading no trabado | pendiente | |
| UI — doble submit | pendiente | |
| Edge — red lenta/error | pendiente | |
| Edge — datos nulos RTDB | pendiente | |
| Servidor local :4200 + smoke | pendiente | |
| Build `npm run build` | pendiente | |

```
# Output npm run build (si hubo errores, pegar aquí)
```

---

## Criterios spec (SC-xxx)

- [ ] SC-001: ...
- [ ] SC-002: ...

---

## Cierre

- [ ] Validación pre-entrega completa (agente; no delegada al usuario)
- [ ] Validación exhaustiva completada y registrada (sección anterior)
- [ ] `spec.md` estado → `done`
- [ ] Commit / deploy — solo si el usuario lo pidió

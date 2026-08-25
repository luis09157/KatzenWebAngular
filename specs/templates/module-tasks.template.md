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

Ejecutar y marcar:

- [ ] `npm run build` — exit 0
- [ ] `npm run functions:build` — si tocó functions
- [ ] Manual localhost: flujo feliz
- [ ] Manual localhost: un error controlado (permiso / validación)
- [ ] `npm run cy:admin` — si cambió ruta admin
- [ ] E2E específico: `cypress/e2e/...` — si se añadió

**Resultado:** _pendiente / OK / fallos anotados abajo_

```
# pegar output relevante o enlazar CI
```

---

## Testing y validación exhaustiva

> **Guía obligatoria:** `specs/templates/qa-validation-guide.md`  
> **Regla:** registrar resultados en esta sección **antes** de marcar `[x]` en cualquier tarea de implementación o testing.

### 1. Formularios y validaciones de entrada

- [ ] **Campos vacíos:** envío bloqueado + alertas visuales (bordes rojos, `mat-error`) en obligatorios
- [ ] **Tipos erróneos:** letras en numéricos, correo/teléfono inválidos, símbolos extraños — rechazados o sanitizados
- [ ] **Límites / desbordamiento:** textos largos en notas/diagnósticos no rompen layout responsivo

### 2. Interfaz, ventanas y modales

- [ ] **Diálogos:** abren y cierran limpiamente; sin scroll lock ni backdrop colgado
- [ ] **Retroalimentación:** toasts/mensajes de éxito y error en tiempo y lugar correctos
- [ ] **Doble submit:** botones de acción deshabilitados o en loading al primer clic

### 3. Casos límite y errores de red

- [ ] **Red lenta / sin conexión:** loading visible, error comprensible, sin registros duplicados
- [ ] **Datos nulos RTDB:** nodos `null`/`undefined` o parciales no colapsan la vista (sin TypeError)

### 4. Integridad final

- [ ] **`npm run build`** ejecutado — exit 0, sin errores de tipado (pegar resumen abajo)
- [ ] **Resultados registrados** en la tabla de abajo antes de cerrar la feature

### Registro de resultados QA

_Completar al terminar cada iteración de validación:_

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | pendiente | |
| Formularios — tipos erróneos | pendiente | |
| Formularios — límites texto | pendiente | |
| Modales — apertura/cierre | pendiente | |
| UI — retroalimentación | pendiente | |
| UI — doble submit | pendiente | |
| Edge — red lenta/error | pendiente | |
| Edge — datos nulos RTDB | pendiente | |
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

- [ ] Validación exhaustiva completada y registrada (sección anterior)
- [ ] `spec.md` estado → `done`
- [ ] Commit / deploy — solo si el usuario lo pidió

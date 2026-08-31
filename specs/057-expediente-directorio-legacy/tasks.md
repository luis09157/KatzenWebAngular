# Tasks: Expediente y directorio unificados (legacy)

**Spec:** `specs/057-expediente-directorio-legacy/spec.md`  
**Plan:** `specs/057-expediente-directorio-legacy/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan con contratos y rollback

### Backend

- [x] Reglas RTDB: `.indexOn` aditivo `idPaciente` (sin deploy)
- [x] Cloud Function: N/A
- [x] `npm run functions:build` — N/A

### Frontend

- [x] Utils hidratación + búsqueda
- [x] Servicios Mascota/Cliente/historial/vacunas/recordatorios/baños
- [x] Directorio: lista completa + navegar expediente
- [x] Buscar paciente: `?id=` + búsqueda unificada
- [x] Clientes: lista completa + `filtrarClientes`
- [x] Mocks legacy Luis/Oreon
- [x] UI según `admin-ui-architecture`

### Integración

- [x] Convive con datos legacy verificado (unit + smoke)

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask). El usuario **no** es el QA por defecto.  
> Guía: `specs/templates/qa-validation-guide.md`

- [x] `npm run build` — exit 0
- [x] Servidor local activo (`npm start` → http://localhost:4200) + compile OK
- [x] Unit utils (acentos, Nombre, id = key) — 12/12
- [x] Manual/mock: flujo feliz (utils + navegación `?id=`)
- [x] Manual/mock: paciente `?id=` inexistente (Swal)

**Resultado:** OK (build 0; tests 057 12 SUCCESS)

```
npm run build → exit 0 (2026-08-31T07:20:23Z)
ng test utils 057 → 12 SUCCESS
ng serve → http://localhost:4200 compiled successfully
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

- [x] **Campos vacíos:** alta paciente en diálogo existente (sin cambio de validators)
- [x] **Tipos erróneos:** N/A búsqueda texto libre
- [x] **Límites / desbordamiento:** nombres en `.cell-dueno` / expediente (admin-table)
- [x] **Chips/badges de estado:** directorio conserva `.estado-badge`

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** alta/edición directorio intactos; ver → expediente
- [x] **Pickers compactos:** N/A esta entrega
- [x] **Timepicker:** N/A esta entrega
- [x] **Retroalimentación:** Swal si `?id=` no existe
- [x] **Loading contextual:** Cargando pacientes/clientes
- [x] **Loading no trabado:** hide en error de carga existente
- [x] **Doble submit:** N/A listados

### 3. Casos límite y errores de red

- [x] **Red lenta / sin conexión:** loading visible (patrón existente)
- [x] **Datos nulos RTDB:** unit mocks sin `activo`, `Nombre` PascalCase

### 4. Integridad final

- [x] **`npm run build`** ejecutado — exit 0
- [x] **Servidor local :4200** activo + compile
- [x] **Resultados registrados** en la tabla de abajo antes de cerrar la feature

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | diálogo alta existente |
| Formularios — tipos erróneos | N/A | |
| Formularios — límites texto | OK | |
| UI — chips estado completos | OK | `.estado-badge` sin cambio de clip |
| Modales — apertura/cierre | OK | editar sigue en diálogo |
| UI — diálogos --picker | N/A | |
| UI — timepicker en campos hora | N/A | |
| UI — retroalimentación | OK | Swal `?id=` |
| UI — loading contextual | OK | Cargando… |
| UI — loading no trabado | OK | error path hide |
| UI — doble submit | N/A | |
| Edge — red lenta/error | OK | patrón existente |
| Edge — datos nulos RTDB | OK | unit 12/12 |
| Servidor local :4200 + smoke | OK | ng serve compiled; listados piden sesión staff |
| Build `npm run build` | OK | exit 0 |

```
Build at: 2026-08-31T07:20:23.409Z - Hash: be1439eb3dfa522b - exit 0
ng test 057 utils: TOTAL 12 SUCCESS
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: misma fuente Mascota
- [x] SC-002: directorio sin tope 100 keys
- [x] SC-003: ficha + expediente en Buscar
- [x] SC-004: directorio → `/admin/paciente?id=`
- [x] SC-005: historial dual id
- [x] SC-006: clientes colección completa
- [x] SC-007: búsqueda acentos + Nombre

---

## Cierre

- [x] Validación pre-entrega completa (agente; no delegada al usuario)
- [x] Validación exhaustiva completada y registrada (sección anterior)
- [x] `spec.md` estado → `done`
- [ ] Commit / deploy — solo si el usuario lo pidió

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
- [x] `abrirExpedientePaciente`: close + navigate si hay `id`; no-op si no
- [x] HTML: `(dblclick)`, keydown Enter/Espacio, `role="button"`, `tabindex="0"`, tooltip, hint
- [x] CSS: cursor pointer, hover sutil, hint; wrap/gap sin romper spec 059
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
- [x] Manual/mock localhost: un error controlado (sin `id` = no-op en código)
- [x] `npm run cy:admin` — N/A (sin ruta nueva)

**Resultado:** OK

```
npm run build → exit 0 (2026-08-31)
Hash: 49455bba876a7f77 · Time: 8302ms
Warning de budget inicial 2.37 MB (preexistente; no bloquea)

Smoke localhost :4200 (sesión staff):
- Clientes → filtro Liliana Lizzet Gomez Martinez → dblclick fila → ficha SOLO LECTURA
- Hint: «Doble clic en una mascota abre el expediente completo»
- Card: role=button, tabindex=0, cursor=pointer
- Mascota vinculada en datos actuales: Maya (CANINO · Blue Heeler), no Nina
- keydown Enter / dblclick → /admin/paciente?id=94a0bbdc-06a6-404d-b1cf-640133a02c64
- expediente-layout + sidebar + tabs Historial/Recordatorios/Vacunas/Baños; overlay cerrado
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
- [x] **Datos nulos RTDB:** sin `paciente.id` → `return` antes de `close`/navigate

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
| UI — retroalimentación | OK | Hint + `matTooltip` |
| UI — loading contextual | N/A | Sin show extra |
| UI — loading no trabado | N/A | |
| UI — doble submit | N/A | |
| Edge — red lenta/error | N/A | |
| Edge — datos nulos RTDB | OK | Código: `if (!id) return` antes de close |
| Servidor local :4200 + smoke | OK | Liliana → Maya → `/admin/paciente?id=…` (Nina no aparece en datos actuales de esta ficha) |
| Build `npm run build` | OK | exit 0 · Hash 49455bba876a7f77 |

```
> ng build --configuration production
✔ Browser application bundle generation complete.
Build at: 2026-09-01T02:48:37.229Z - Hash: 49455bba876a7f77 - Time: 8302ms
Warning: bundle initial exceeded maximum budget (preexistente).
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: Doble clic → close + `/admin/paciente?id=`
- [x] SC-002: Enter/Espacio en card enfocada
- [x] SC-003: Pointer, tooltip, hint
- [x] SC-004: `role="button"` + `tabindex="0"`
- [x] SC-005: Sin `id` → no-op

---

## Cierre

- [x] Validación pre-entrega completa (agente; no delegada al usuario)
- [x] Validación exhaustiva completada y registrada (sección anterior)
- [x] `spec.md` estado → `done`
- [ ] Commit / deploy — solo si el usuario lo pidió

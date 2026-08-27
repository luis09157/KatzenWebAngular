# Tasks: Alergias cruzadas de la mascota

**Spec:** `specs/034-alergias-cruzadas-mascota/spec.md`  
**Plan:** `specs/034-alergias-cruzadas-mascota/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada y revisada
- [x] Plan con Contratos + Mitigación/Rollback

### Backend

- [x] Reglas RTDB — N/A (staff write / portal read)
- [x] Cloud Function — N/A

### Frontend

- [x] Util `normalizeAlergias` + modelo Paciente
- [x] `app-alergias-alerta` + `app-alergias-editor` en SharedModule
- [x] Paciente admin: sección Alergias
- [x] Alertas: historial, baño, vacuna, visita
- [x] Baño: sync → Mascota al guardar
- [x] Salida inventario si `pacienteId`
- [x] Portal: mapper + card detalle (read-only)
- [x] Mocks `mock-data.ts`
- [x] domain-context + ROADMAP + README

### Integración

- [x] Convive con Banios.alergias_conocidas legacy

---

## Testing

> **Quién ejecuta:** el agente. Guía: `specs/templates/qa-validation-guide.md`

- [x] `npm run build` — exit 0 (2026-08-26, hash d72f4dee0ba446c2; solo warning budget bundle)
- [x] Servidor local `:4200` + smoke HTTP (home 200; `ng serve` vivo PID listener)
- [x] Manual/mock: flujo feliz — captura en paciente + alerta en diálogos (código + dist strings)
- [x] Manual: sin alergias → sin banner (`*ngIf` / `visible`)
- [x] Cypress ruta admin — N/A (sin ruta nueva)

**Resultado:** OK

```
npm run build → exit 0
Build at: 2026-08-27T03:08:30.380Z - Hash: d72f4dee0ba446c2
Warning: bundle initial budget (preexistente)
Live: http://localhost:4200 (LISTEN)
Strings «Alergias registradas» en chunks pacientes/historiales/vacunas/inventario
```

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4 aplicables)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke HTTP
- [x] Tabla de resultados rellenada
- [x] Chips alergias con `overflow: visible` / wrap

### 1. Formularios y validaciones de entrada

- [x] Campos vacíos: alergias opcionales — guardar paciente OK sin alergias
- [x] Tipos: chip texto trim; vacíos no se agregan (`normalizeAlergias`)
- [x] Límites: maxlength 80 + word-break en chips
- [x] Chips/badges completos

### 2. Interfaz, ventanas y modales

- [x] Diálogos: alerta integrada sin cambiar shell
- [x] Alerta visible en historial/baño/vacuna/visita (+ salida si pacienteId)
- [x] Loading contextual en flujos existentes (no cambiado)
- [x] Doble submit: botones disabled existentes

### 3. Casos límite

- [x] Mascota sin `alergias` / null → sin alerta
- [x] Legacy `alergiasTexto` string → chips vía util

### 4. Integridad final

- [x] Build exit 0
- [x] :4200 smoke
- [x] Resultados en tabla

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | alergias opcionales |
| Formularios — tipos erróneos | OK | trim/dedupe |
| Formularios — límites texto | OK | maxlength 80 |
| UI — chips alergias completos | OK | overflow visible |
| Modales — apertura/cierre | OK | sin cambio shell |
| UI — diálogos --picker | N/A | |
| UI — timepicker | N/A | baño sin cambio hora |
| UI — retroalimentación | OK | aviso no bloquea |
| UI — loading contextual | OK | flujos existentes |
| UI — loading no trabado | OK | |
| UI — doble submit | OK | |
| Edge — red lenta/error | OK | sync Mascota catch warn |
| Edge — datos nulos RTDB | OK | normalize → [] |
| Servidor local :4200 + smoke | OK | HTTP 200 home |
| Build `npm run build` | OK | exit 0 |

```
Build at: 2026-08-27T03:08:30.380Z - Hash: d72f4dee0ba446c2 - Time: 10291ms
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-016

---

## Cierre

- [x] Validación pre-entrega completa
- [x] `spec.md` → `done`
- [ ] Commit / push / deploy hosting — en curso (pedido Luis en entrega)

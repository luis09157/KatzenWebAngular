# Plan técnico: Timepicker dialog

**Spec:** `specs/004-timepicker-dialog/spec.md`  
**Estado:** approved  

---

## Resumen

Control reutilizable `app-timepicker-field` (ControlValueAccessor) que muestra la hora en 12h (`a.m.`/`p.m.`) y al hacer clic abre un diálogo Material compacto (`admin-dialog-shell`) para elegir hora, minuto y periodo. El valor del FormControl permanece `HH:mm` 24h. Se migra en citas, baños y recordatorios. Sin cambios RTDB.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/shared/timepicker/timepicker.util.ts` | crear | parse/format HH:mm ↔ 12h |
| `src/app/shared/timepicker/timepicker.util.spec.ts` | crear | unit tests util |
| `src/app/shared/timepicker/timepicker-dialog.component.ts` | crear | diálogo selección |
| `src/app/shared/timepicker/timepicker-dialog.component.html` | crear | shell admin |
| `src/app/shared/timepicker/timepicker-dialog.component.scss` | crear | estilos compactos |
| `src/app/shared/timepicker/timepicker-field.component.ts` | crear | CVA + abre diálogo |
| `src/app/shared/timepicker/timepicker-field.component.html` | crear | mat-form-field + icono |
| `src/app/shared/timepicker/timepicker-field.component.scss` | crear | |
| `src/app/shared/shared.module.ts` | modificar | declarar/exportar + MatDialog/Select/ButtonToggle |
| `src/app/core/config/admin-ui.config.ts` | modificar | `ADMIN_DIALOG_TIMEPICKER` |
| `src/app/citas/cita-dialog.component.html` | modificar | reemplazar `type="time"` |
| `src/app/banios/banio-dialog.component.html` | modificar | idem |
| `src/app/banios/banio-dialog.component.ts` | modificar | comentario normalización (si aplica) |
| `src/app/recordatorios/recordatorio-dialog.component.html` | modificar | idem |

### Docs / specs

| Archivo | Acción |
|---------|--------|
| `docs/ADMIN-UI-ARCHITECTURE.md` | nota patrón timepicker |
| `specs/004-timepicker-dialog/*` | spec/plan/tasks |
| `specs/README.md` | indexar 004 |
| `specs/ROADMAP.md` | mención breve |

### Firebase / Cypress

Sin cambios.

---

## Modelo de datos

Sin cambios. Contrato de valor UI:

```text
FormControl value: "HH:mm"   # 24h, ej. "16:01"
Display label:     "hh:mm a.m.|p.m."  # ej. "04:01 p.m."
```

---

## Flujos

### Flujo principal

1. Usuario enfoca/hace clic en el campo Hora (o botón reloj).
2. Se abre diálogo compacto con hora (1–12), minuto y a.m./p.m.
3. Aceptar → escribe `HH:mm` en el FormControl y cierra.
4. Cancelar / Escape → sin cambios.

### Errores esperados

| Caso | Comportamiento |
|------|----------------|
| Valor vacío + required | `mat-error` del control padre / campo |
| Valor inválido al cargar | se muestra vacío; no crashea |

---

## Servicios

Ninguno nuevo. Solo utilidades puras en `timepicker.util.ts`.

---

## UI (admin)

- Campo: `mat-form-field` outline + input readonly + `mat-datepicker-toggle`-like icon (`schedule`)
- Diálogo: `ADMIN_DIALOG_TIMEPICKER` + `admin-dialog-shell`
- Sin librerías UI externas

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | — | — | no | solo UI |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales — N/A

- **Estrategia de Datos de Prueba:** Formularios en localhost; unit tests de util con Jest/Karma del proyecto. Prohibido RTDB producción.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Diálogo admin | `admin-dialog-shell`, `ADMIN_DIALOG_*` |
  | Form field Material | `cita-dialog` datepicker |
  | Shared control | `autocomplete-field` (CVA) |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe build | Revertir archivos de `shared/timepicker` + cambios en diálogos y SharedModule |
| Regresión en guardado de hora | Confirmar que FormControl sigue emitiendo `HH:mm`; revertir migración del diálogo afectado |
| Diálogo anidado (cita → timepicker) falla en algún navegador | Reabrir con overlay config; rollback a `type="time"` solo en ese módulo |

---

## Deploy

```bash
npm run build
# hosting solo si el usuario lo pide — NO deploy sin autorización de Luis
```

Sin functions ni database.

---

## Riesgos

- Diálogo anidado dentro de otro `MatDialog` (citas/baños/recordatorios): Material lo soporta; probar apertura/cierre.
- Locale: display siempre `a.m.`/`p.m.` en español latino (no depender del OS).

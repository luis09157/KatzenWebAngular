# Spec: Datepicker canónico (selección de fecha)

**ID:** 090-datepicker-canonico  
**Estado:** done  
**Fecha:** 2026-10-02  
**Autor:** Cursor / Luis Alfonso Niño Martínez  
**Nivel:** L2 (UI compartida; sin cambios RTDB)  

---

## Problema

Varios formularios admin usaban `input type="date"` nativo (texto editable / formato inconsistente entre navegadores). En pensión y otros flujos el staff debía **escribir** la fecha en lugar de elegirla en un calendario. Eso genera formatos distintos y errores de captura.

Paralelismo con el timepicker (**004**): un control compartido, locale **es-MX**, valor canónico en formularios.

---

## User stories

### US-1 — Elegir fecha con calendario Material

Como **recepción / doctor / administrador**  
Quiero **abrir un datepicker al hacer clic en el campo de fecha**  
Para **seleccionar el día sin escribir a mano**

**Criterios de aceptación:**

- [x] SC-001: Al hacer clic en el campo (o en el ícono de calendario) se abre el panel Material datepicker.
- [x] SC-002: Display con locale **es-MX** (día/mes/año); el input del campo canónico es `readonly` (no se escribe libre).
- [x] SC-003: El valor del `FormControl` / `ngModel` del control canónico es **`yyyy-MM-dd`** (ISO fecha-local).

### US-2 — Control reutilizable estándar

Como **desarrollador del sistema**  
Quiero **`app-datepicker-field` en SharedModule**  
Para **usar el mismo patrón en todos los formularios admin que pidan fecha**

**Criterios de aceptación:**

- [x] SC-004: Componente implementa `ControlValueAccessor` (`formControlName` / `ngModel`).
- [x] SC-005: Util `datepicker.util.ts` para parse/format ISO ↔ `Date` local (sin sesgo UTC de medianoche).
- [x] SC-006: Documentado en `docs/ADMIN-UI-ARCHITECTURE.md`, guardrails y `module-map`.

### US-3 — Migración de `type="date"` y click en datepickers existentes

Como **staff**  
Quiero **el mismo comportamiento de calendario en pensión, visitas, caja, consentimientos, inventario y filtros**  
Para **formatos y UX uniformes**

**Criterios de aceptación:**

- [x] SC-007: Eliminados `input type="date"` del admin; reemplazados por `app-datepicker-field` donde el valor era string ISO.
- [x] SC-008: Campos que ya usaban `mat-datepicker` con `Date` en el control: al clic abren el calendario (toggle + click en input).
- [x] SC-009: Prohibido nuevos `type="date"` nativos en admin (igual que `type="time"` → **004**).

---

## Fuera de alcance

- Cambiar contratos RTDB de fechas ya persistidas (siguen ISO o lo que cada módulo ya guarde).
- Selector de mes nativo (`type="month"`) en Finanzas.
- Portal dueños (sin campos fecha editables hoy).
- Librerías externas de datepicker.

---

## Contratos de Datos y UI

| Capa | Contrato |
|------|----------|
| `app-datepicker-field` CVA | string `yyyy-MM-dd` o `null` / `''` |
| UI | Material datepicker, locale `es-MX` |
| Persistencia | Cada módulo sigue su nodo; no se renombran campos |

**Rollback:** revertir commit del componente + migraciones HTML; sin migración de datos.

---

## Código

| Qué | Dónde |
|-----|-------|
| Campo canónico | `src/app/shared/datepicker/datepicker-field.component.*` |
| Util ISO | `src/app/shared/datepicker/datepicker.util.ts` (+ `.spec.ts`) |
| Export | `SharedModule` → `DatepickerFieldComponent` |
| Migrados a field | pensión, visita, caja/corte, consentimiento, entrada inventario, dashboard owner, filtro finanzas |
| Ya mat-datepicker + click | citas, baños, vacunas, recordatorios, historiales, pacientes, OC, reportes, movimientos |

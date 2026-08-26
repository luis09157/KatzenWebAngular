# Spec: Timepicker dialog (selección de hora)

**ID:** 004-timepicker-dialog  
**Estado:** done  
**Fecha:** 2026-08-25  
**Autor:** Cursor agent (coordinado con Luis Alfonso Niño Martínez)

---

## Problema

Los formularios admin usan `input type="time"` nativo (flechitas del navegador). En macOS/Chrome el control es poco usable, inconsistente entre plataformas y no se alinea con el resto de diálogos Material (`admin-dialog-shell`). El staff necesita elegir hora de forma clara al agendar citas, baños y recordatorios.

---

## User stories

### US-1 — Elegir hora con diálogo usable

Como **recepcionista / doctor / administrador**  
Quiero **abrir un selector de hora al hacer clic en el campo Hora**  
Para **elegir la hora sin depender de las flechitas nativas del navegador**

**Criterios de aceptación:**

- [x] SC-001: Al hacer clic (o Enter/Espacio) en el campo Hora se abre un diálogo/panel Material alineado con `admin-dialog-shell`
- [x] SC-002: El selector permite elegir hora y minutos de forma clara; periodo **a.m. / p.m.** en UI (español latino)
- [x] SC-003: El valor del `FormControl` permanece en formato **`HH:mm` (24h)** para compatibilidad con validadores, servicios y RTDB existentes

### US-2 — Control reutilizable estándar

Como **desarrollador del sistema**  
Quiero **un control `app-timepicker-field` en SharedModule**  
Para **usar el mismo patrón en todos los formularios admin que pidan hora**

**Criterios de aceptación:**

- [x] SC-004: Componente implementa `ControlValueAccessor` (binding con `formControlName`)
- [x] SC-005: Accesible: label, teclado (abrir/cerrar), botones con `aria-label` en español
- [x] SC-006: Documentado como patrón UI estándar en `docs/ADMIN-UI-ARCHITECTURE.md` y en esta spec

### US-3 — Migración de inputs nativos

Como **staff**  
Quiero **el mismo timepicker en citas, baños y recordatorios**  
Para **una experiencia uniforme al cargar horarios**

**Criterios de aceptación:**

- [x] SC-007: Reemplazado en `cita-dialog` (prioridad)
- [x] SC-008: Reemplazado en `banio-dialog` y `recordatorio-dialog` (únicos otros `type="time"` del repo)

---

## Fuera de alcance

- Cambios en nodos o formato RTDB de `hora` / `hora_banio` / fechas ISO
- Migrar el selector hora/minuto separado de `historial-dialog` (ya no usa `type="time"`)
- Portal dueños (no hay `type="time"` hoy)
- Librerías UI externas de timepicker

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno. Solo UI; el valor escrito sigue siendo string `HH:mm` (o el formato que ya guardaba cada módulo).

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | — | — | Sin cambios de esquema |

- **Estrategia de Datos de Prueba:** Mocks locales / formularios en localhost. Prohibido conectar a RTDB de producción (`katzen-a0e3e`).

- **Patrones UI Reutilizados:** `admin-dialog-shell` / `admin-dialog-panel`, `ADMIN_DIALOG_*` en `admin-ui.config.ts`, Material MDC (`mat-form-field`, `mat-dialog`, `mat-button-toggle`), referencia visual datepicker en `cita-dialog`.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (módulos con campos hora) |
| doctor | sí |
| recepcionista | sí |
| peluquero | sí (baños / recordatorios según módulo) |

No cambia la matriz de `StaffModule`; solo mejora el control de formulario.

---

## UI (rutas y layout)

- Sin rutas nuevas
- Control: `app-timepicker-field` (SharedModule)
- Diálogo compacto: `ADMIN_DIALOG_TIMEPICKER`
- **Patrón estándar del sistema:** todo campo de hora en formularios admin nuevos debe usar `app-timepicker-field` en lugar de `type="time"`

---

## Backend

- [ ] Cloud Function — no
- [ ] Reglas RTDB — no
- [ ] Email / integración externa — no

---

## Testing mínimo

Ver `tasks.md` sección Testing + QA exhaustiva.

---

## Notas / decisiones

- **Display:** 12h con `a.m.` / `p.m.` (p. ej. `04:01 p.m.`), coherente con locale del navegador en el screenshot.
- **Modelo:** `HH:mm` 24h en el FormControl (p. ej. `16:01`) — igual que `type="time"` y validadores actuales.
- **Minutos:** paso configurable (`minuteStep`, default `1`); UI con selects de hora (1–12), minuto y periodo.
- **UX espaciado (2026-08-25):** el shell genérico pone `padding: 0` en `.admin-dialog-body`. El timepicker usa `admin-dialog-shell--picker` con padding body ≥28×32, gap ≥24px, footer ≥18×28×22; panel `ADMIN_DIALOG_TIMEPICKER` a 420px. Criterio documentado en `docs/ADMIN-UI-ARCHITECTURE.md` § Diálogos compactos tipo picker.

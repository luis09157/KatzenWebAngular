# Spec: Layout responsivo de diálogos admin (regla permanente)

**ID:** 059-dialogos-admin-layout-responsivo  
**Estado:** in_progress  
**Fecha:** 2026-08-31  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  

---

## Problema

En el overlay CDK de Angular Material, un selector global en `src/styles/admin-dialog.scss` quitaba el padding del body de **cualquier** diálogo que contuviera `.entity-summary`:

```scss
.admin-dialog-panel mat-dialog-content.admin-dialog-body:has(.entity-summary) {
  padding: 0 !important;
}
```

Eso no es un layout interno: el hero no aporta padding propio. El contenido queda pegado a los bordes, con huecos enormes entre hero y formulario, o recortado. Además, `mat-tab-group` en overlay colapsa el body (`height: 0` / `overflow: hidden`) y la superficie (`max-height: 88vh` + `overflow: hidden`) recorta si el body no puede scrollear.

La ficha de paciente (Oreon, spec 058) fue el caso que lo hizo visible. **El mismo patrón aplica a todos los diálogos admin** (cliente, cita, vacuna, historial, baño, recordatorio, consentimiento, paciente, usuario, citas del día, etc.). Esta spec es una **regla permanente de UI**, no un arreglo one-off.

---

## User stories

### US-1 — Diálogos admin sin recortes ni padding indebido

Como **staff**  
Quiero **que cada diálogo/ventana admin muestre todo el contenido con padding correcto**  
Para **leer y editar fichas sin contenido pegado, cortado o con huecos enormes**

**Criterios de aceptación:**

- [x] SC-001: El CSS global **no** usa `:has(.entity-summary)` para poner `padding: 0` en `.admin-dialog-body`. `padding: 0` solo si existe layout interno (`.admin-dialog-layout`, `.admin-dialog-layout--readonly`, `.info-grid`, `.admin-dialog-form--padded`).
- [x] SC-002: `.entity-summary` en `.admin-dialog-panel` es compacto (margin-bottom 16px, padding-bottom 12px); no huecos de 22px/18px entre hero y contenido.
- [x] SC-003: Si el pane/superficie tiene `overflow: hidden` y `max-height`, el **body** del diálogo puede scrollear (`overflow-y: auto`); el contenido no se recorta.
- [x] SC-004: Diálogos picker usan `admin-dialog-shell--picker` + `ADMIN_DIALOG_TIMEPICKER` (u homólogo). CRUD grandes usan shell estándar + `ADMIN_DIALOG_*`. Ficha paciente: `ADMIN_DIALOG_FICHA` + `admin-dialog-panel--ficha`.

### US-2 — Tabs visibles en overlay y en página

Como **staff**  
Quiero **ver el expediente o el contenido de las pestañas**  
Para **no quedarme solo con el hero / cabecera**

**Criterios de aceptación:**

- [x] SC-005: En `.admin-dialog-panel`, `mat-tab-group .mat-mdc-tab-body-wrapper` y `.mat-mdc-tab-body-content` tienen `overflow: visible` y `height: auto`. Preferir `dynamicHeight` si el contenido varía.
- [x] SC-006: En la página de expediente (`/admin/paciente`), `.expediente-tabs` no colapsa el contenido (mismas reglas de overflow/height; `dynamicHeight`).
- [x] SC-007: Fichas con tabs (paciente; cliente si aplica) muestran el bloque de expediente/contenido, no solo el hero.

### US-3 — Responsivo ~375px

Como **staff en tablet o teléfono**  
Quiero **dueño/meta apilable y chips completos**  
Para **usar el diálogo sin layout aplastado**

**Criterios de aceptación:**

- [x] SC-008: En viewport ~375px, bloques dueño/meta se apilan; chips/badges se ven completos; no hay layout pegado a un lado con hueco vacío.

---

## Fuera de alcance

- Cambios de lógica de negocio, servicios o RTDB
- Refactors grandes de HTML de cada diálogo más allá de layout (padding, tabs, compactación)
- `git commit` / `git push` / `firebase deploy`
- Features nuevas de producto (no entra en ROADMAP)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno. Solo CSS/HTML de overlay y documentación. App móvil no afectada.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | no | no | sin cambios de contrato |

- **Estrategia de Datos de Prueba:** Sesión staff en localhost (`http://localhost:4200`) o mocks locales. **Prohibido** RTDB producción (`katzen-a0e3e`).

- **Patrones UI Reutilizados:** `admin-dialog-shell`, `ADMIN_DIALOG_*` (`admin-ui.config.ts`), `.entity-summary`, `mat-tab-group`, `admin-dialog-panel--ficha`. Spec de diseño: `docs/ADMIN-UI-ARCHITECTURE.md` regla 12. QA: `specs/templates/qa-validation-guide.md` §2.5.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (todos los diálogos) |
| doctor | sí (módulos de su matriz) |
| recepcionista | sí si el módulo está en su matriz |

---

## UI (rutas y layout)

- No hay ruta nueva. Afecta overlays abiertos desde módulos existentes (`/admin/clientes`, `/admin/citas`, `/admin/pacientes-admin`, etc.).
- CSS canónico: `src/styles/admin-dialog.scss`.
- Ficha: `ADMIN_DIALOG_FICHA` en `src/app/core/config/admin-ui.config.ts`.

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md` sección Testing y validación exhaustiva. Smoke: ficha paciente + al menos 3–4 diálogos con `.entity-summary`.

---

## Notas / decisiones

- Spec 058 cubre el **producto** de la ficha (dblclick + expediente). **059** cubre la **regla global** de layout de diálogos para que el agente no tenga que recordarlo.
- Si un diálogo usa `admin-dialog-layout` / `--padded` internamente, el `padding: 0` del body es intencional: el layout ya tiene padding propio.
- `overflow: hidden` en la superficie MDC es válido **si** `mat-dialog-content.admin-dialog-body` tiene `overflow-y: auto`.

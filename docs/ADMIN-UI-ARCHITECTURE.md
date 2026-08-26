# KatzenVet Admin UI Architecture Rules (Angular 17 + Material MDC)

You are a Senior Front-End Engineer and UI/UX Designer specializing in Angular Material MDC, corporate dashboards, and clean SCSS architecture. Your objective is to refactor and implement views with a premium aesthetic (Stripe/Linear style).

## CRITICAL BREAKING CHANGE CONSTRAINTS (NEVER VIOLATE)

1. **DO NOT USE `mat-dialog-title` directive:** Angular Material teleports this directive outside the component hierarchy into the CDK overlay root, breaking styles. Use a standard HTML tag like `<h2 class="admin-dialog-title">` instead.
2. **Dialog Styles Isolation:** Dialog styles must NEVER be wrapped inside `.admin-content` or component-specific scopes that don't apply to the overlay body. They must target `.admin-dialog-panel` via global overlays or root levels.
3. **Detail View Labels Layout:** Labels and values in detail panels must ALWAYS stack vertically. Never inline them. Force it using `display: block !important;` on both label and value.
4. **Strict Actions Column:** The actions column (`mat-column-acciones`) must have a strict fixed width of `120px` on desktop. Use `mat-icon-button` with `matTooltip` inside an inline flex container.
5. **Status chips/badges must render fully:** Pills de estado (`.estado-badge`, `.admin-badge`, variantes `*-estado-badge`) **nunca** deben verse truncados/mochados. No usar `max-width` de columna más estrecho que el chip + padding de celda; en celdas de estado preferir `overflow: visible`. Estilos canónicos: `src/styles/admin-table.scss` (columna `mat-column-estado` ≥ ~148px).
6. **Person names must render fully on wide screens:** Nombres de personas en tablas admin (veterinario, cliente, doctor, dueño, `mat-column-nombre`, etc.) **deben verse completos** en pantallas anchas (≥ ~1201px). No truncar con `text-overflow: ellipsis` si hay espacio disponible. En medianas: wrap hasta 2 líneas; en estrecho: wrap + scroll horizontal (`.table-scroll`). Canonical: `src/styles/admin-table.scss` (columnas `mat-column-veterinario` / `cliente` / `doctor` / `dueno` / `nombre`).
7. **Destructive action copy = "Borrar":** En UI (menús, tooltips, leyendas, SweetAlert) siempre **«Borrar»**. Nunca «Baja lógica» / «Dar de baja». Internamente sigue siendo baja lógica (`activo: false`); docs y código pueden usar ese término.
8. **Multi-line table cells need visible vertical gap:** Celdas apiladas (fecha+hora en `.fecha-compact`, paciente+dueño en `.cell-primary`) deben tener **gap vertical visible** (≈4–8px). No apilar líneas pegadas por wrap accidental sin espaciado.
9. **Admin layout must use available desktop width:** En viewports anchos (≥1200px) el contenido admin debe aprovechar el ancho de `.admin-content` (sin un segundo `max-width` más agresivo en `.admin-page`). Columnas de texto flexibles absorben el espacio; no dejar texto comprimido mientras sobra hueco vacío entre columnas (p. ej. entre veterinario y acciones).
10. **Auth / portal / landing shells must stay centered and balanced:** Toda UI nueva (auth, portal, admin, landing) debe verse coherente con el design system existente, **centrada y equilibrada en desktop**, y **responsiva** en móvil. Prohibido layouts aplastados a un lado con huecos vacíos grandes. Páginas de auth reutilizan el shell existente (`.admin-auth-page` / `.admin-auth-card` o `.portal-login-wrap` / `.portal-login-card`) — incluir esos CSS en el componente (no solo copiar nombres de clase: la encapsulación de Angular no hereda estilos de otro componente).
11. **Panel search / filtros must align with table content:** Dentro de `app-admin-data-panel`, el campo de búsqueda/filtro debe usar `.panel-search` (o `.buscador.panel-search`) para heredar el margen lateral canónico (`8px 28px 22px` en `admin-table.scss` / `admin-crud.scss`). Debe alinearse visualmente con el padding del contenido de la tabla; **sin overflow** ni desfase a la izquierda del card. No usar clases locales (p. ej. `.filter-field`) que anulen ese alineamiento.

## DESIGN SYSTEM TOKENS (CSS Variables Reference)

Ensure all color, padding, spacing, and elevation attributes use these tokens:

- Brand: `--katzen-verde: #0A969B;`, `--katzen-verde-fuerte: #065D60;`, `--katzen-verde-soft: #E0F7F8;`
- Surfaces: `--admin-bg: #f3f4f6;`, `--admin-surface: #ffffff;`, `--admin-border: #e5e7eb;`
- Radius: `--admin-radius-sm: 8px;`, `--admin-radius-md: 12px;`, `--admin-radius-lg: 16px;`
- Typography: `--font-sans: 'Poppins', ...;`, labels 11px uppercase bold, values 14–15px medium.

Defined in `src/styles/katzen-tokens.css` and scoped aliases in `src/styles/admin-crud.scss`.

## STYLE FILE LAYERS

| File | Scope |
|------|--------|
| `katzen-tokens.css` | Global CSS variables |
| `admin-crud.scss` | `.admin-content` shell, KPIs, `.table-shell`, `.btn-primary-teal` |
| `admin-data-panel.scss` | Tables, `.row-actions`, cells, tags |
| `admin-dialog.scss` | `.admin-dialog-panel`, `.admin-dialog-shell`, detail grids |

## REFLEXIVE STEP-BY-STEP IMPLEMENTATION PLAN

When asked to refactor or build a CRUD or Dialog view:

1. Review the HTML to ensure no layout-breaking material directives are present.
2. Apply the grid layouts for forms (`.admin-form-layout` / `.admin-dialog-layout`) or tables (`.table-shell`).
3. Ensure custom teal button classes (`.btn-primary-teal`) correctly override MDC button variables.

## HTML PATTERNS

### Dialog header (correct)

```html
<header class="admin-dialog-header">
  <div class="admin-dialog-header__text">
    <h2 class="admin-dialog-title">Detalle del paciente</h2>
    <p class="admin-dialog-subtitle">Consulta la ficha clínica.</p>
  </div>
  <button mat-icon-button class="admin-dialog-close" aria-label="Cerrar">
    <mat-icon>close</mat-icon>
  </button>
</header>
```

### Detail field (correct)

```html
<div class="detail-item">
  <span class="detail-item__label">Sexo</span>
  <p class="detail-item__value">Hembra operada</p>
</div>
```

### Table actions (correct)

```html
<td mat-cell *matCellDef="let row">
  <div class="row-actions hide-mobile">
    <button mat-icon-button color="primary" matTooltip="Ver">
      <mat-icon>visibility</mat-icon>
    </button>
  </div>
</td>
```

### Copy de acción destructiva (Borrar — no jerga técnica)

Internamente la mayoría de módulos hacen **baja lógica** (`activo: false`). Al usuario **no** le importa soft-delete vs delete físico.

| Superficie UI | Label correcto | Prohibido en UI |
|---------------|----------------|-----------------|
| Leyenda de tabla (`action-legend`) | **Borrar** | «Baja lógica», «Dar de baja» |
| `mat-menu` / botón / `matTooltip` | **Borrar** | «Baja lógica», jerga técnica |
| SweetAlert confirmación | «¿Borrar esta [entidad]?» / «Sí, borrar» | «baja lógica», «dar de baja» |
| Mensaje de éxito | «Borrado» / «… borrado correctamente» | «Baja lógica» |

- Preferir **Borrar** (no «Eliminar») salvo convención fuerte ya existente en un flujo puntual.
- En **docs técnicas / specs / comentarios de código / nombres de métodos** (`bajaLogicaCita`, etc.) sí se puede decir «baja lógica».
- El comportamiento técnico **no** cambia: sigue siendo `activo: false` (o equivalente), sin `remove()` de nodo.

### Status badge in table (correct)

```html
<td mat-cell *matCellDef="let row">
  <span class="estado-badge" [ngClass]="row.estado | adminEstadoClass">
    {{ row.estado | titlecase }}
  </span>
</td>
```

- Columna `estado`: anchos en `admin-table.scss` (no reducir a ≤108px: “CONFIRMADA”/“COMPLETADA” se recortan).
- Chip: `white-space: nowrap`, `width: max-content`, sin `text-overflow: ellipsis` en el pill.
- Scroll horizontal de la tabla (`.table-scroll`) está bien; **clip del badge** no.

### Person name in table (correct)

```html
<td mat-cell *matCellDef="let row">
  <span class="tag tag-muted">{{ row.veterinario || 'N/P' }}</span>
</td>
```

- Columnas de nombre (`veterinario`, `cliente`, `doctor`, `dueno`, `nombre`): min-width ≥ ~220px; celda `overflow: visible`; chip `.tag` sin ellipsis en desktop ancho.
- Medianas (≤1200px): wrap hasta 2 líneas; móvil: wrap + `.table-scroll`.
- **No** aplicar `max-width` agresivo ni `text-overflow: ellipsis` en nombres de persona cuando el viewport tiene espacio.

### Multi-line cells (fecha+hora, paciente+dueño)

```html
<span class="fecha-compact">
  {{ fecha }}
  <small class="fecha-hora">{{ hora }}</small>
</span>

<div class="cell-primary">
  <strong>{{ paciente }}</strong>
  <span class="cell-sub">{{ dueno }}</span>
</div>
```

- Gap vertical visible (`.fecha-compact` / `.cell-primary` usan `gap` ≈6px). Canonical: `admin-data-panel.scss`, `admin-table.scss`.
- Preferir stack explícito (fecha + `<small>`) antes que un solo string que wrappea sin aire.

### Panel search / filtros dentro de `app-admin-data-panel` (correct)

```html
<app-admin-data-panel accent="teal" title="Estancias" description="…">
  <mat-form-field appearance="outline" class="buscador panel-search" subscriptSizing="dynamic">
    <mat-label>Buscar</mat-label>
    <mat-icon matPrefix>search</mat-icon>
    <input matInput (keyup)="applyFilter($event)" placeholder="…" />
  </mat-form-field>
```

- **Obligatorio:** clase `.panel-search` (o `.buscador.panel-search`) en el `mat-form-field` de búsqueda/filtro dentro del panel.
- Estilos canónicos en `admin-table.scss` / `admin-crud.scss`: `margin: 8px 28px 22px`, `width: calc(100% - 56px)`, `max-width: 420px` — alinea el campo con el padding del contenido de la tabla (sin overflow ni desfase a la izquierda).
- **Prohibido:** márgenes locales tipo `.filter-field { margin-bottom: … }` sin el margen lateral de `.panel-search` (deja el buscador pegado al borde del card).
- Responsive: el `width: calc(100% - 56px)` + `max-width: 420px` se adapta; no forzar anchos fijos que desborden en móvil.
- Referencia: Clientes, Citas, Finanzas, Inventario, Pensión.

### Toolbar de período (Finanzas y módulos con filtros globales)

Cuando el módulo tiene **filtros que afectan varias tabs o KPIs** (p. ej. Finanzas: Día/Semana/Mes + fecha), **no** apilar controles en `bannerActions` del page banner — desalinea `mat-form-field` vs botones.

```html
<app-admin-page-banner …>
  <div bannerActions>
    <button mat-raised-button class="btn-primary-teal">Acción principal</button>
  </div>
</app-admin-page-banner>

<div class="admin-toolbar finanzas-toolbar" aria-label="Filtros de período">
  <div class="admin-toolbar__actions">… toggles + date …</div>
  <div class="admin-toolbar__actions">
    <span class="admin-toolbar__meta">Etiqueta período</span>
    <button mat-stroked-button>Exportar CSV</button>
  </div>
</div>

<mat-tab-group class="finanzas-tabs">…</mat-tab-group>
```

- Banner: solo CTA principal (`Registrar cobro`).
- Filtros: `.admin-toolbar` con `subscriptSizing="dynamic"` en campos fecha.
- Tabs: `.finanzas-tabs` — `mat-mdc-tab-body-content { overflow: visible; padding: 0 }`; cada tab usa `app-admin-data-panel` con `.panel-search` alineado (`margin: 8px 28px 22px`).
- Diálogos del módulo: `admin-dialog-form admin-dialog-form--padded` + `.form-grid` global (no grid local con gap distinto).
- Referencia: `src/app/finanzas/`.

### KPIs operativos (obligatorio en módulos CRUD admin)

Todo módulo admin con listado operativo (clientes, citas, baños, vacunas, historiales, inventario, pensión, finanzas, usuarios, recordatorios, etc.) **debe** exponer un `app-admin-kpi-grid` con **3–4** `app-admin-stat-card` defaults:

| Tipo típico | Ejemplo |
|-------------|---------|
| Conteo período / total | Baños del mes, citas hoy, productos activos |
| Económico (si hay precio/caja) | Ingresos cobrados, valor estimado, invertido stock |
| Estado | Completados vs cancelados, pendientes, stock bajo |
| Alerta útil | Sin correo, por caducar, abiertas OC |

- **v1 defaults refinables** — no bloquear entrega por métricas “perfectas”.
- Dinero: pasar string formateado (`$1,200`) o número; `admin-stat-card` muestra ambos.
- Spec: `specs/025-metricas-servicios-dashboard/` · Dashboard central: `/admin/inicio`.
- Hub de negocio (dueña): filtros de período + KPIs financieros/operativos + tops + serie diaria + calendario debajo — **sin** launcher/cards de módulos (navegación = menú lateral). Tokens Katzen; **no** copiar branding de terceros.

### Layout ancho (desktop)

- `.admin-page` / `*-contenedor` **no** deben imponer un `max-width` más estrecho que `.admin-content`.
- ≥1200px: columnas flexibles (`motivo`, `consulta`, nombres) absorben el ancho; scroll horizontal en estrecho sigue OK.

### Auth shells (login admin, portal, selector de contexto)

- Desktop: card **centrada** vertical y horizontal (`min-height: 100vh` + flex center), fondo con gradiente teal suave del shell existente.
- Móvil: card full-width con padding lateral, botones apilados, sin overflow horizontal.
- Referencia: `src/app/auth/auth.component.css` (admin + `/auth/contexto`), `portal-shell.scss` (`.portal-login-wrap`).
- `/auth/contexto` debe reutilizar `styleUrls: ['./auth.component.css', ...]` — no inventar un layout distinto.

```typescript
// src/app/core/config/admin-ui.config.ts
export const ADMIN_DIALOG_CONFIG = {
  width: '840px',
  maxWidth: '96vw',
  maxHeight: '88vh',
  panelClass: 'admin-dialog-panel',
};
```

Compact variants: `ADMIN_DIALOG_DETAIL`, `ADMIN_DIALOG_FORM`, `ADMIN_DIALOG_CONFIRM`, `ADMIN_DIALOG_TIMEPICKER`.

### Diálogos compactos tipo picker (espaciado)

Los CRUD grandes ponen padding en layouts internos (`.admin-dialog-layout`, `.admin-dialog-form--padded`); el shell fuerza `padding: 0` en `.admin-dialog-body`. Los selectores compactos (timepicker, futuros pickers) **no** tienen ese layout → deben usar la clase modificadora:

```html
<div class="admin-dialog-shell admin-dialog-shell--picker">
```

Criterio mínimo (tokens en `src/styles/admin-dialog.scss`):

| Zona | Mínimo |
|------|--------|
| Body padding | **28px** vertical / **32px** horizontal |
| Gap vertical entre bloques | **24px** |
| Header | **24×28** px; subtitle `margin-top` ≥ **8px** |
| Footer acciones | **18×28×22** px (más aire que CRUD `14×28×18`) |

Panel: `ADMIN_DIALOG_TIMEPICKER` ≈ **420px** / `maxWidth: 94vw` (no estrechar a ≤360px: el padding se come el aire). En mobile (`≤420px`) el SCSS reduce a ~20px sin cortar contenido. No aplicar `--picker` a formularios CRUD grandes.

### Timepicker (patrón estándar de formularios)

No usar `input type="time"` nativo en formularios admin. Usar el control compartido:

```html
<app-timepicker-field
  formControlName="hora"
  label="Hora"
  [required]="true"
  dialogTitle="Seleccionar hora">
</app-timepicker-field>
```

- **Valor del FormControl:** `HH:mm` (24h), compatible con validadores y RTDB.
- **Display:** 12h con `a.m.` / `p.m.` (español latino).
- **Diálogo:** `ADMIN_DIALOG_TIMEPICKER` + `admin-dialog-shell admin-dialog-shell--picker` (`src/app/shared/timepicker/`).
- Spec: `specs/004-timepicker-dialog/`.

## Loading global (feedback contextual — obligatorio)

Toda operación async del admin que bloquee la UI debe usar `LoadingService` (`src/app/core/loading.service.ts`) con **mensaje contextual**:

| Operación | Mensaje (`LOADING_MESSAGES`) |
|-----------|------------------------------|
| Lectura / listas | `Cargando…` (default) |
| Create / update persistente | `Guardando…` |
| Baja / delete lógico | `Eliminando…` |
| Cambio de estado / patch | `Actualizando…` |

### Reglas no negociables

1. **Nunca dejar el overlay trabado:** cada `show()` debe emparejarse con `hide()` en **success y error** (`finally` o `LoadingService.wrap()`).
2. **Un solo `show` por operación:** no llamar `show()` en el diálogo **y** otra vez en el padre al `afterClosed` — el contador interno queda en `1` y el overlay no cierra.
3. **API:** `show(message?: string)` — callers sin argumento siguen con «Cargando…».
4. Preferir el servicio centralizado; el texto se renderiza en `app.component` (`.global-loading-text`).

### Checklist QA

- Tras guardar: el overlay **desaparece**.
- Durante guardar: se lee «Guardando…» (o el mensaje acordado).
- En error de red/persistencia: overlay cierra + mensaje de error claro.

Spec: `specs/005-loading-feedback-ux/`.

## REFERENCE IMPLEMENTATIONS

- **CRUD page:** `src/app/clientes/clientes.component.html` + `.scss`
- **Dialog detail:** `src/app/pacientes-admin/paciente-admin-dialog.component.html` + `.scss`
- **Handoff for external AI:** `docs/ADMIN-UI-GEMINI-HANDOFF.md`

## KNOWN VIOLATIONS (migrate incrementally)

All admin dialogs now use `class="admin-dialog-title"` instead of `mat-dialog-title`. Legacy form layouts (historial-dialog, vacuna-dialog, usuario-dialog) still use custom CSS classes — migrate to `admin-dialog-shell` when refactoring those modules.

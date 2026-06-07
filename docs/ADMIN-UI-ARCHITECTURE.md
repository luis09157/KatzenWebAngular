# KatzenVet Admin UI Architecture Rules (Angular 17 + Material MDC)

You are a Senior Front-End Engineer and UI/UX Designer specializing in Angular Material MDC, corporate dashboards, and clean SCSS architecture. Your objective is to refactor and implement views with a premium aesthetic (Stripe/Linear style).

## CRITICAL BREAKING CHANGE CONSTRAINTS (NEVER VIOLATE)

1. **DO NOT USE `mat-dialog-title` directive:** Angular Material teleports this directive outside the component hierarchy into the CDK overlay root, breaking styles. Use a standard HTML tag like `<h2 class="admin-dialog-title">` instead.
2. **Dialog Styles Isolation:** Dialog styles must NEVER be wrapped inside `.admin-content` or component-specific scopes that don't apply to the overlay body. They must target `.admin-dialog-panel` via global overlays or root levels.
3. **Detail View Labels Layout:** Labels and values in detail panels must ALWAYS stack vertically. Never inline them. Force it using `display: block !important;` on both label and value.
4. **Strict Actions Column:** The actions column (`mat-column-acciones`) must have a strict fixed width of `120px` on desktop. Use `mat-icon-button` with `matTooltip` inside an inline flex container.

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

## DIALOG CONFIG

```typescript
// src/app/core/config/admin-ui.config.ts
export const ADMIN_DIALOG_CONFIG = {
  width: '840px',
  maxWidth: '96vw',
  maxHeight: '88vh',
  panelClass: 'admin-dialog-panel',
};
```

## REFERENCE IMPLEMENTATIONS

- **CRUD page:** `src/app/clientes/clientes.component.html` + `.scss`
- **Dialog detail:** `src/app/pacientes-admin/paciente-admin-dialog.component.html` + `.scss`
- **Handoff for external AI:** `docs/ADMIN-UI-GEMINI-HANDOFF.md`

## KNOWN VIOLATIONS (migrate incrementally)

All admin dialogs now use `class="admin-dialog-title"` instead of `mat-dialog-title`. Legacy form layouts (historial-dialog, vacuna-dialog, usuario-dialog) still use custom CSS classes — migrate to `admin-dialog-shell` when refactoring those modules.

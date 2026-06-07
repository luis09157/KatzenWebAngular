# KatzenVet Admin UI — Handoff para rediseño (Gemini / IA)

> **Reglas canónicas:** ver [`ADMIN-UI-ARCHITECTURE.md`](./ADMIN-UI-ARCHITECTURE.md)  
> **Stack:** Angular 17 + Angular Material (MDC) + SCSS  
> **Objetivo visual:** Panel admin corporativo, limpio, tipo Stripe / Shopify / Linear  
> **Módulos:** Pacientes, Clientes, Citas, Historiales, Vacunas, Baños, Usuarios, Contactos web  
> **Problemas actuales:** Modales ilegibles, tablas apretadas, KPIs muy grandes, estilos duplicados/conflictivos

---

## PROMPT SUGERIDO PARA GEMINI

```
Eres un diseñador UI/UX senior especializado en Angular Material y dashboards administrativos premium.

Te paso el design system y CSS actual de KatzenVet Admin. Necesito que:

1. Unifiques tokens de color, tipografía, espaciado y radios en un solo sistema coherente.
2. Rediseñes el layout de:
   - Página CRUD (KPIs + toolbar + tabla mat-table)
   - Modal de detalle solo lectura (paciente/cliente)
   - Modal de edición (formulario con secciones)
3. Propongas CSS/SCSS final listo para pegar, sin romper Angular Material MDC.
4. Reglas:
   - NO usar mat-dialog-title dentro de headers custom (Material lo teleporta y rompe el layout)
   - Estilos de diálogo deben ir en .admin-dialog-panel o en :host del componente (overlay fuera de .admin-content)
   - Tabla: acciones con mat-icon-button + matTooltip, columna ~120px
   - Labels de detalle: display block, label arriba valor abajo (nunca inline)
   - Fondo página admin: #f3f4f6 o #f4f9f9, tarjetas blancas
   - Marca: teal #0A969B, dark #065D60
5. Entrega: tokens CSS, SCSS por capas, y ejemplo HTML de una fila de tabla + modal detalle.
```

---

## ARQUITECTURA DE ARCHIVOS (repo)

```
src/styles/katzen-tokens.css       → variables CSS globales
src/styles/admin-crud.scss         → shell .admin-content, tablas base
src/styles/admin-data-panel.scss   → tablas, acciones, celdas, tags
src/styles/admin-dialog.scss       → modales (overlay CDK, NO dentro de .admin-content)
src/app/clientes/clientes.component.scss  → referencia página CRUD premium (clientes)
src/app/pacientes-admin/paciente-admin-dialog.component.scss → detalle paciente
src/app/core/config/admin-ui.config.ts    → width dialog: 840px
```

**Importante:** Los estilos bajo `.admin-content` NO aplican dentro de `MatDialog` (overlay en body).

---

## TOKENS DE DISEÑO

```css
:root {
  /* Marca KatzenVet */
  --katzen-verde: #0A969B;
  --katzen-verde-claro: #09C1CD;
  --katzen-verde-fuerte: #065D60;
  --katzen-verde-soft: #E0F7F8;

  /* Superficies admin */
  --admin-bg: #f3f4f6;        /* fondo página (clientes) */
  --admin-bg-alt: #f4f9f9;    /* fondo shell legacy */
  --admin-surface: #ffffff;
  --admin-border: #e5e7eb;
  --admin-border-soft: #d8e6e6;

  /* Texto */
  --admin-text: #111827;
  --admin-text-secondary: #6b7280;
  --admin-text-muted: #9ca3af;
  --admin-text-brand: #065d60;

  /* Estados */
  --admin-success-bg: #ecfdf5;
  --admin-success-text: #047857;
  --admin-danger: #dc2626;

  /* Layout */
  --admin-radius-sm: 10px;
  --admin-radius-md: 12px;
  --admin-radius-lg: 16px;
  --admin-shadow-sm: 0 1px 3px rgba(17, 24, 39, 0.06);
  --admin-shadow-md: 0 8px 24px rgba(17, 24, 39, 0.08);

  /* Tipografía */
  --font-sans: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## PATRÓN HTML — PÁGINA CRUD (referencia Clientes)

```html
<div class="admin-page clientes-page">
  <!-- KPIs: grid 4 cols, mat-card mat-elevation-z1 -->
  <div class="kpi-row">...</div>

  <!-- Título módulo -->
  <header class="module-header">
    <h1 class="module-header__title">Clientes</h1>
    <p class="module-header__subtitle">Descripción breve</p>
  </header>

  <!-- Toolbar: búsqueda izq, botones der -->
  <div class="toolbar mat-elevation-z1">
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="toolbar__search">
      <mat-icon matPrefix>search</mat-icon>
      <input matInput placeholder="Buscar..." />
    </mat-form-field>
    <div class="toolbar__actions">
      <button mat-stroked-button color="primary">Filtro</button>
      <button mat-raised-button color="primary" class="btn-primary-teal">+ Nuevo</button>
    </div>
  </div>

  <!-- Tabla -->
  <mat-card class="table-shell mat-elevation-z1">
    <div class="table-wrap">
      <table mat-table [dataSource]="dataSource" class="clientes-table">
        <!-- columnas -->
        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef>Acciones</th>
          <td mat-cell *matCellDef="let row">
            <div class="row-actions hide-mobile">
              <button mat-icon-button color="primary" matTooltip="Ver"><mat-icon>visibility</mat-icon></button>
              <button mat-icon-button matTooltip="Editar"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button matTooltip="Baja"><mat-icon>delete_outline</mat-icon></button>
            </div>
            <button mat-icon-button class="show-mobile-only" [matMenuTriggerFor]="menu">
              <mat-icon>more_vert</mat-icon>
            </button>
          </td>
        </ng-container>
      </table>
    </div>
    <mat-paginator></mat-paginator>
  </mat-card>
</div>
```

---

## PATRÓN HTML — MODAL DETALLE (NO usar mat-dialog-title)

```html
<div class="admin-dialog-shell admin-dialog-shell--readonly">
  <header class="admin-dialog-header">
    <div class="admin-dialog-header__text">
      <div class="admin-dialog-header__top">
        <span class="admin-dialog-badge admin-dialog-badge--readonly">Solo lectura</span>
        <h2 class="admin-dialog-title">Detalle del paciente</h2>
      </div>
      <p class="admin-dialog-subtitle">Consulta la ficha clínica.</p>
    </div>
    <button mat-icon-button class="admin-dialog-close"><mat-icon>close</mat-icon></button>
  </header>

  <mat-dialog-content class="admin-dialog-body">
    <div class="entity-detail">
      <div class="entity-detail__hero">
        <div class="entity-detail__photo"><img src="..." alt=""></div>
        <div class="entity-detail__headline">
          <h3>Sevilla</h3>
          <p>FELINO · Doméstico Mexicano</p>
          <span class="entity-status">Vivo</span>
        </div>
      </div>
      <section class="detail-section">
        <h4 class="detail-section__title">Datos clínicos</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-item__label">Sexo</span>
            <p class="detail-item__value">Hembra Operada</p>
          </div>
        </div>
      </section>
    </div>
  </mat-dialog-content>

  <mat-dialog-actions class="admin-dialog-actions">
    <button mat-button>Cerrar</button>
    <button mat-stroked-button color="primary">Editar</button>
  </mat-dialog-actions>
</div>
```

**Config TypeScript:**
```typescript
export const ADMIN_DIALOG_CONFIG = {
  width: '840px',
  maxWidth: '96vw',
  maxHeight: '88vh',
  panelClass: 'admin-dialog-panel'
};
```

---

## CSS COMPLETO — CAPA GLOBAL TABLAS + ACCIONES

```scss
/* === admin-data-panel.scss === */
.admin-content .row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.admin-content .row-actions .mat-mdc-icon-button {
  width: 36px;
  height: 36px;
  color: #6b7280;
}

.admin-content .row-actions .mat-mdc-icon-button[color='primary'] {
  color: #0a969b;
}

.admin-content .mat-column-acciones {
  width: 120px !important;
  min-width: 120px !important;
  text-align: right !important;
}

.admin-content .table-scroll {
  overflow-x: auto;
  margin: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.admin-content .mat-mdc-header-cell {
  background: #f9fafb !important;
  font-size: 0.6875rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280 !important;
}

.admin-content .mat-mdc-row {
  min-height: 52px;
}

.admin-content .cell-primary strong {
  display: block;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
}

.admin-content .cell-sub {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

.admin-content .tag-muted {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.6875rem;
  background: #f3f4f6;
  color: #374151;
}

.admin-content .hide-mobile { display: flex; }
.admin-content .show-mobile-only { display: none !important; }

@media (max-width: 900px) {
  .admin-content .hide-mobile { display: none !important; }
  .admin-content .show-mobile-only { display: inline-flex !important; }
}
```

---

## CSS COMPLETO — MODALES (admin-dialog.scss)

```scss
.admin-dialog-panel .mat-mdc-dialog-container {
  border-radius: 16px !important;
  padding: 0 !important;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(17, 24, 39, 0.14) !important;
}

.admin-dialog-shell {
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  background: #fff;
}

.admin-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.admin-dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.admin-dialog-subtitle {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.admin-dialog-body {
  padding: 0 !important;
  overflow: auto;
}

.admin-dialog-actions {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 8px;
  padding: 14px 24px 18px !important;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* Detalle solo lectura */
.entity-detail { padding: 20px 24px; }

.entity-detail__hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
}

.entity-detail__photo {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.entity-detail__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail-section__title {
  margin: 0 0 10px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #065d60;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.detail-item {
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.detail-item__label {
  display: block;
  margin: 0 0 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6b7280;
}

.detail-item__value {
  display: block;
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #111827;
  line-height: 1.45;
}

/* Formulario edición */
.admin-dialog-layout {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 24px;
  padding: 24px;
}

.form-section__title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #065d60;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 16px;
}

.form-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}
```

---

## CSS REFERENCIA — PÁGINA CLIENTES (más pulida)

```scss
$bg-page: #f3f4f6;
$border: #e5e7eb;
$teal: #0a969b;

.clientes-page {
  background: $bg-page;
  padding: 24px 28px 36px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.kpi-card {
  border-radius: 12px;
  border: 1px solid $border;
  background: #fff;
}

.kpi-card__value {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid $border;
  border-radius: 12px;
  margin-bottom: 16px;
}

.toolbar__search {
  max-width: 360px;
}

.btn-primary-teal {
  --mdc-protected-button-container-color: #{$teal};
}

.table-shell {
  border-radius: 12px;
  border: 1px solid $border;
  overflow: hidden;
}

.badge-expediente {
  font-family: ui-monospace, monospace;
  padding: 3px 10px;
  border-radius: 8px;
  background: #f3f4f6;
  border: 1px solid $border;
}

.badge-estado--activo {
  padding: 4px 10px;
  border-radius: 12px;
  background: #ecfdf5;
  color: #047857;
  font-size: 0.75rem;
  font-weight: 600;
}
```

---

## PROBLEMAS CONOCIDOS A RESOLVER

| Problema | Causa | Fix |
|----------|-------|-----|
| Texto `SexoHembra` pegado | Label/value inline, estilos no aplican en overlay | `display:block` en component SCSS `:host` |
| Botón X fuera de lugar | `mat-dialog-title` teleportado por Material | Usar `h2.admin-dialog-title` sin directiva |
| Tabla acciones apretadas | Botones stroked con texto | `mat-icon-button` + tooltip |
| KPIs enormes | Cards verticales con mucho padding | Grid horizontal compacto (clientes) |
| Estilos inconsistentes | Mezcla legacy + nuevo en cada módulo | Un solo SCSS global + 1 template |

---

## CHECKLIST VISUAL OBJETIVO

- [ ] Fondo gris claro, tarjetas blancas con borde sutil (no sombras pesadas)
- [ ] Tipografía: títulos 700, labels 600 uppercase 11px, valores 15px
- [ ] Tabla: header #f9fafb, filas 52px, hover suave
- [ ] Modal: max 840px, secciones con títulos teal uppercase
- [ ] Detalle: foto max 72px, grid 2 cols, label SIEMPRE arriba del valor
- [ ] Botones primarios teal #0A969B, radius 10-12px
- [ ] Espaciado base: 8 / 12 / 16 / 24 px

---

## COMPONENTES ANGULAR SHARED

```
app-admin-kpi-grid
app-admin-stat-card
app-admin-page-banner
app-admin-data-panel
app-admin-empty-state
```

Algunos módulos usan estos; Clientes usa mat-card directo (referencia más limpia).

---

*Generado desde KatzenWebAngular — Jun 2026*

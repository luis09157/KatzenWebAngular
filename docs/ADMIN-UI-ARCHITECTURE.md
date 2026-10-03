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
12. **Dialog layout must not clip or collapse content (spec 059):** Nunca usar `:has(.entity-summary)` para quitar padding del body. `padding: 0` en `.admin-dialog-body` solo si hay layout interno (`.admin-dialog-layout`, `.admin-dialog-form--padded`, `.info-grid`). Tabs (`mat-tab-group`) en overlay/página: `height: auto` + `overflow: visible`; preferir `dynamicHeight`. Superficie con `overflow: hidden` solo si el body puede scrollear. `.entity-summary` compacto (≤16px / 12px). Fichas con tabs deben mostrar el expediente, no solo el hero. Ficha paciente: `ADMIN_DIALOG_FICHA` + `admin-dialog-panel--ficha`. Pickers: `--picker`; CRUD grandes: shell estándar. **Pie del modal:** usar `mat-dialog-actions` con clase `admin-dialog-actions` **o** `<footer class="admin-dialog-footer">` (mismos tokens en `admin-dialog.scss`); **prohibido** un footer sin esas clases (queda pegado al borde). Cerrar izquierda + primario derecha: spacer `flex: 1` (p. ej. `.alta-rapida-spacer`).
13. **Admin pages must reflow (spec 061 + 084 US-7):** Toda pantalla admin (`.admin-page`, dashboards, expedientes, CRUD, POS si comparte shell) **no** fuerza N columnas cuando el **ancho útil** de `.admin-content` (viewport menos sidenav y padding) no las cabe. Usar container `admin-page` en `.admin-content`. Guía: ≥ ~1100px útil → 3 columnas si el layout las pide; ~720–1099 → 2; &lt;720 → 1. Toolbars/filas de botones: `flex-wrap` + gap; lo que baja de línea se alinea al **inicio** (no huérfanos a la derecha). `matTooltip` `position="below"` + aire bajo la toolbar para no tapar la card. Buscadores: label/placeholder no recortados; en estrecho el botón «Nuevo» apila o va a full width (`.panel-search` / `.admin-split-toolbar`). Cards: padding interno ≥16px (bloques acento tipo DUEÑO ≥20px); gap entre cards ≥16px (20–24px desktop). Timelines: gap vertical ~8–12px. Desktop ≥1200px viewport **y** útil suficiente: regla 9 (aprovechar ancho; no max-width interno que aplaste texto). **Diálogos densos / catálogos (POS `.pos-grid`, tiles):** mismo criterio por ancho del grid (no solo viewport): `auto-fill` + `minmax` legible; prohibido `repeat(4+, 1fr)` que trunque nombres. Ver sección «Diálogos densos…» abajo. **059 = diálogos shell; 061 = páginas; 084 US-7 = legibilidad grids densos.** Canonical: `src/styles/admin-page-layout.scss`, `admin-crud.scss`, `visita-dialog.component.scss`.
14. **Listas de avisos densas (alertas / pendientes):** En hubs y listados de alertas **prohibido** cards altas con mensaje en columna estrecha y hueco vacío. Usar `.admin-dense-list` + `.admin-dense-row`: fila ~48–56px, título **1 línea** (ellipsis), meta **1 línea**, acciones a la derecha. El hub de Inventario solo muestra **resumen** (conteo + ≤3 ejemplos); el listado completo vive en `/admin/inventario/alertas`. Canonical: `src/styles/admin-dense-list.scss` · docs § Listas densas · spec **061** follow-up.
15. **Sidenav auto-hide + hamburguesa (spec 061 US-6):** El menú lateral admin **no** queda fijo permanente en desktop. Tras ~15 s de inactividad sobre el menú (o al navegar) se **oculta** para ganar ancho útil en `.admin-content`. El staff lo reabre con el **menú hamburguesa** de la toolbar. Pause del timer mientras el puntero está sobre el sidenav. Resize solo reaplica al cruzar 900px. Canonical: `admin-main-layout.component.ts` (`SIDENAV_AUTO_HIDE_MS`).

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
| `admin-dense-list.scss` | Listas de avisos densas (`.admin-dense-list` / `.admin-dense-row`) |
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

### Dialog footer (correct)

CRUD estándar (acciones a la derecha):

```html
<mat-dialog-actions class="admin-dialog-actions">
  <button mat-button type="button">Cancelar</button>
  <button mat-raised-button color="primary" class="btn-primary-teal" type="button">Guardar</button>
</mat-dialog-actions>
```

Wizard / ayuda (Cerrar a la izquierda, primario a la derecha):

```html
<footer class="admin-dialog-footer">
  <button mat-button type="button">Cerrar</button>
  <span class="alta-rapida-spacer" aria-hidden="true"></span>
  <button mat-raised-button color="primary" class="btn-primary-teal" type="button">Siguiente</button>
</footer>
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
  <div class="row-actions hide-mobile" (click)="$event.stopPropagation()" (dblclick)="$event.stopPropagation()">
    <button mat-icon-button color="primary" matTooltip="Ver detalle" (click)="verDetalle(row)">
      <mat-icon>visibility</mat-icon>
    </button>
  </div>
</td>
```

### Table row double-click = Ver detalle (spec 073 — MUST)

En listados admin (`mat-table` / `.table-scroll`) el **doble clic en la fila** abre el **mismo** detalle que el ojo / `verDetalle`. No es un atajo solo de Citas: es regla de todo el sistema.

```html
<tr
  mat-row
  *matRowDef="let row; columns: displayedColumns"
  class="data-row data-row--interactive"
  title="Doble clic para ver detalle"
  (dblclick)="verDetalle(row)">
</tr>
```

- Handler: el mismo método que el botón «Ver detalle» (citas → `verCita`, clientes → `abrirFichaCliente` / `verCliente`, etc.).
- `.row-actions` (y el menú ⋮ móvil) **siempre** `$event.stopPropagation()` en `click` y `dblclick`: un clic en el ojo, editar o WhatsApp no abre el detalle por burbujeo.
- Filas con detalle: clase `data-row--interactive` (cursor pointer + `user-select: none` en `admin-table.scss`). Leyenda del panel: **«Doble clic para ver detalle»**.
- Productos: desktop doble clic = detalle; el ojo permanece; en móvil un clic puede abrir (el doble clic no es fiable).
- Tablas **sin** ficha/detalle (reportes, caja solo-borrar, KPIs): no inventar un `verDetalle`.
- Directorio (**058**): doble clic = ficha rápida; el icono de carpeta sigue siendo el expediente.

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

### Páginas admin — grid, toolbars, buscadores (spec 061)

**059 = diálogos.** **061 = páginas/shells** (`.admin-page`, dashboards, expedientes, CRUD, POS si comparte shell).

`.admin-content` es un **container** (`container-name: admin-page`). Los grids deben responder a ese ancho útil (el sidenav ~280px **no** entra en `@media` de viewport).

| Ancho útil `.admin-content` | Layout |
|-----------------------------|--------|
| ≥ ~1100px | 3 columnas si el diseño las pide |
| ~720–1099px | 2 columnas |
| &lt; 720px | 1 columna (stack) |

```scss
.admin-content {
  container-type: inline-size;
  container-name: admin-page;
}
```

- **Prohibido** `grid-template-columns: 1fr 1fr 1fr` / `repeat(3, …)` fijos sin breakpoint de **útil**.
- Toolbars / `.banner-actions`: `flex-wrap` + `justify-content: flex-start`; botones que bajan **no** quedan huérfanos a la derecha. `matTooltipPosition="below"` + delay; aire bajo la fila para que el tooltip no tape la card.
- Buscador + «Nuevo»: `.admin-split-toolbar` / `.tab-panel__toolbar--split`. En estrecho el botón apila o va a 100%. Label/placeholder **sin** ellipsis por campo estrecho. `.panel-search` (regla 11) donde aplique.
- Cards: padding ≥16px; bloques acento (DUEÑO) ≥20px. Gap entre cards ≥16px (20–24px desktop).
- Timelines: `gap` ~8–12px entre ítems.
- Desktop ancho: regla 9 — si cabe, usar el ancho; no “todo chiquito”.
- Canonical: `src/styles/admin-page-layout.scss`. Encapsulación del componente solo si pisa el global.

### Diálogos densos y grids de catálogo (POS / tiles) — spec 084 US-7

**059** define shell de diálogo; **084 SC-012…017** exigen legibilidad + click en contenido interno (web + tablet).

- Grids de productos / tiles densos: columnas explícitas por breakpoint (**1 → 2 → 3**, nunca 4 fijas). Preferir `repeat(N, minmax(0, 1fr))` estable.
- Estilos críticos del catálogo POS viven en **`admin-dialog.scss`** (`.admin-dialog-panel--pos`) porque el diálogo está en overlay CDK; host `app-visita-dialog { display: block; height: 100% }`.
- Fotos: altura fija compacta (~72–88px). **Prohibido** `aspect-ratio`+`max-height` (colapsa a rayitas) y **prohibido** `-webkit-line-clamp` si se fuerza `display: block` (el nombre desaparece).
- **Sin imagen:** nombre + precio obligatorios y con contraste pleno (#0f172a / #0f766e), no estado disabled.
- Tarifas baño/`BACO*` / EXAM: `productoDescuentaInventarioPos` — seleccionables con `stock_actual=0`; no `registrarSalida`.
- Canal: web desktop + tablet táctil (targets ≥44px; sin hover-only).
- Canonical: `admin-dialog.scss` + `visita-dialog.component.scss` + `producto-search.util.ts`.

### Sidenav y toolbar (menú 3 mundos)

- El sidenav (`admin-main-layout`) usa `.admin-sidenav__scroll` con `overflow-y: auto` y `min-height: 0` para que **Pensión, Alertas, logout** no se corten contra el dock. Auto-hide ~15 s + hamburguesa (regla 15 / 061 US-6): no asumir menú siempre visible al medir layouts.
- Labels del menú: wrap hasta 2 líneas + `title` nativo en textos largos («Directorio de pacientes»). No clip de una sola línea (`Directorio de pa…`).
- Toolbar ≤900px: `more_vert` con cuenta, sucursal y atajos; chips de usuario/sucursal van en `.hide-mobile`.
- Shell: `.admin-shell` / `.mat-drawer-container` = `height: 100dvh`. **Nunca** `height: 100%` en el contenedor: anula el `100dvh` y, con `overflow: hidden` de Material, recorta páginas y tablas **sin scroll**.
- Contenido: `.mat-drawer-content` / `.mat-sidenav-content` con `overflow-y: auto` (scroll independiente del sidenav). Tablas: `.table-scroll` hace scroll horizontal; el vertical lo hace la página.
- `app-admin-page-banner` / `app-admin-data-panel`: el `@Input() title` no debe filtrarse al atributo nativo `title` del host (tooltip negro huérfano). Host: `[attr.title]: null`.
- Leyenda Ver detalle / Editar / Borrar: footer del data-panel (`.data-panel-footer`), no esquina superior derecha.

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

Ficha rápida (Directorio, spec 058/059): `ADMIN_DIALOG_FICHA` + `panelClass: ['admin-dialog-panel', 'admin-dialog-panel--ficha']` (max-height 92vh, padding propio; no depende de `:has(.entity-summary)`). Compact variants: `ADMIN_DIALOG_DETAIL`, `ADMIN_DIALOG_FORM`, `ADMIN_DIALOG_CONFIRM`, `ADMIN_DIALOG_TIMEPICKER`. Caja POS (punto de venta, spec 055): `ADMIN_DIALOG_POS` + panel `admin-dialog-panel--pos` (fullscreen en ≤720px; desktop `min(1120px, 98vw)` con `border-radius: 16px`). El acento teal del panel es un `::before` de 5px recortado por el radio — **no** `border-top` (deja esquinas cuadradas). Paso 3 Cobrar: `floatLabel="always"` + `subscriptSizing="dynamic"` + wrapper outline transparente para que el label no cruce el borde; footer agrupado `Cerrar/Atrás | Imprimir/Guardar | Cobrar` con wrap en ≤720px. Home `/admin/visitas`: tiles táctiles. Diálogo: **grid con foto** (043 / placeholder), tap = agregar, +/−/quitar ≥48px, sticky cliente + Cobrar; 3 rieles (Petshop | Consulta | Peluquería). Producto/vacuna/medicamento: `precio_venta` de inventario (copy «Precio de inventario»), sin prompt de monto. **Servicios de clínica (056):** CRUD `/admin/servicios-clinica` (Administración); diálogo con costo («Lo que te cuesta a ti»), precio al público («Lo que cobra el cliente», IVA incluido si aplica), checkbox IVA 16% y lectura de ganancia. El riel Consulta lista esos servicios + vacuna/medicamento. Al vender, la línea guarda snapshot `costo`/`iva`/`ganancia` (el cajero no pide costo). Baño: default 022 precargado y editable («Puedes ajustar el precio de este baño») + ganancia venta−costo; no se migra al nodo 056. El POS **no** crea/edita Productos, Clientes ni Pacientes. En localhost, si `usarCatalogoDemoPos` está ON, aparece el banner **«Catálogo de muestra — no se guarda»** (`app-flow-hint` warn); esos 6 ítems `demo-pos-*` no van a inventario.

### Diálogos compactos tipo picker (espaciado)

Los CRUD grandes ponen padding en layouts internos (`.admin-dialog-layout`, `.admin-dialog-form--padded`); el shell fuerza `padding: 0` en `.admin-dialog-body` **solo** cuando existe ese layout (`:has(.admin-dialog-layout)`, `:has(.admin-dialog-form--padded)`, `:has(.info-grid)`). **Prohibido** `:has(.entity-summary)` para quitar padding: el hero no es un layout interno y deja el contenido pegado o cortado (spec 059). Si el body no tiene layout interno, el padding default (24×28) debe permanecer.

Tabs Material en overlay o página: forzar `height: auto` y `overflow: visible` en `.mat-mdc-tab-body-wrapper` / `.mat-mdc-tab-body-content`; usar `dynamicHeight` si el contenido varía. No recortar el expediente detrás del hero.

`.entity-summary` es compacto (margin-bottom 16px, padding-bottom 12px). Dueño/meta apilable en ~375px; chips completos.

Los selectores compactos (timepicker, futuros pickers) **no** tienen layout interno → deben usar la clase modificadora:

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

### Listas densas de avisos (alertas / pendientes) — regla 14

**Problema a evitar:** cards “gordas” con el mensaje en una columna estrecha, mucho hueco blanco y scroll infinito (p. ej. 287 alertas de inventario).

**Patrón obligatorio** en cualquier listado de avisos admin:

```html
<div class="admin-dense-list">
  <div class="admin-dense-row admin-dense-row--critica">
    <span class="estado-badge admin-dense-row__prio">Crítica</span>
    <div class="admin-dense-row__body">
      <p class="admin-dense-row__title" title="…">Mensaje en una línea</p>
      <p class="admin-dense-row__meta">Tipo · fecha · dato corto</p>
    </div>
    <div class="row-actions">…</div>
  </div>
</div>
```

| Regla | Detalle |
|-------|---------|
| Altura | ~48–56px por fila (desktop) |
| Título | 1 línea + ellipsis; `title` nativo con texto completo |
| Meta | 1 línea; no repetir el mismo dato del título |
| Hub vs listado | Dashboard Inventario = resumen (conteo + ≤3); listado completo = `/admin/inventario/alertas` |
| Acciones | `.row-actions` con `width: auto !important` (el global de tablas usa `width: 100%` y **aplasta** el texto) |
| Detalle | Icono `info` → diálogo con mensaje, producto, stock, fecha + CTAs Resolver / Ver producto / OC |

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

### Datepicker (patrón estándar de formularios)

No usar `input type="date"` nativo en formularios admin. Preferir el control compartido (valor ISO):

```html
<app-datepicker-field
  formControlName="fecha"
  label="Fecha"
  [required]="true">
</app-datepicker-field>
```

- **Valor del FormControl / ngModel:** `yyyy-MM-dd` (ISO fecha-local).
- **Display:** locale `es-MX` (dd/mm/aaaa); input `readonly`; clic abre el calendario Material.
- **Util:** `src/app/shared/datepicker/datepicker.util.ts`.
- Si un formulario ya usa `mat-datepicker` con `Date` en el control: mantener toggle + `(click)="picker.open()"` + `readonly` (no teclear).
- Spec: `specs/090-datepicker-canonico/`.

### Cliente-Paciente Picker (regla global — obligatorio)

Cuando un modal, vista o módulo admin involucra **cliente (dueño)** y **paciente (mascota)**:

1. **Orden fijo:** primero cliente, después paciente (mascotas del cliente seleccionado).
2. **Buscador/autocomplete** de clientes (nombre, apellidos, teléfono, correo, expediente).
3. Al elegir cliente → cargar/filtrar pacientes activos de ese cliente en segundo selector.
4. **Autorrellenar** `cliente_id`, `paciente_id`, nombres display y datos enlazados vía `(selectionChange)`.
5. **Prohibido** texto libre para cliente/paciente donde deba haber enlace RTDB.

Componente compartido:

```html
<form [formGroup]="form">
  <app-cliente-paciente-picker
    [formGroup]="form"
    (selectionChange)="onClientePacienteSelected($event)">
  </app-cliente-paciente-picker>
</form>
```

- **Ubicación:** `src/app/shared/admin/cliente-paciente-picker.component.ts`
- **Utils:** `cliente-search.util.ts`, `paciente-search.util.ts`, `paciente-cliente.util.ts`
- **Spec:** `specs/029-cliente-paciente-picker/`
- **Módulos:** pensión, citas, baños, vacunas, historiales, recordatorios (todos migrados al picker compartido)

## Loading global (feedback contextual — obligatorio)

Toda operación async del admin que bloquee la UI debe usar `LoadingService` (`src/app/core/loading.service.ts`) con **mensaje contextual**:

| Operación | Mensaje (`LOADING_MESSAGES`) |
|-----------|------------------------------|
| Lectura / listas | `Cargando…` (default) |
| Catálogo POS / inventario | `Cargando productos…` (`loadingCatalog`) |
| Panel Hoy / dashboard | `Cargando panel…` (`loadingPanel`) o loading local |
| Create / update persistente | `Guardando…` |
| Cobro POS / caja | `Cobrando…` (`charging`) |
| Baja / delete lógico | `Eliminando…` |
| Cambio de estado / patch | `Actualizando…` |

### Reglas no negociables

1. **Nunca dejar el overlay trabado:** cada `show()` debe emparejarse con `hide()` en **success y error** (`finally` o `LoadingService.wrap()`).
2. **Un solo `show` por operación:** no llamar `show()` en el diálogo **y** otra vez en el padre al `afterClosed` — el contador interno queda en `1` y el overlay no cierra.
3. **Prohibido `show()` justo antes de `dialogRef.close()`:** el patrón `show(); close()` asume que el padre hará `hide()`. Si el diálogo se abre desde otro flujo (p. ej. «Llegó un paciente» / `alta-rapida`), **nadie** hace `hide()` y el overlay queda eterno. Correcto: `show` al iniciar la async → `hide` en `finally` → luego `close`.
4. **Prohibido `await` de UI post-éxito dentro del `try` con `show`:** no await Swal (PDF / WhatsApp / imprimir), `navigator.share`, generación jspdf ni diálogos similares **antes** del `finally { hide() }`. Si el usuario no cierra el Swal o el share no resuelve, el overlay («Cobrando…» / «Guardando…») queda eterno. Orden canónico: **persistir → `finally` `hide()` → luego ofrecer acciones**. Ref: `visita-dialog` `confirmarCobro` (specs **005** / **092**).
5. **API:** `show(message?: string)` — callers sin argumento siguen con «Cargando…». `forceHide()` solo como red de seguridad / recuperación.
6. Preferir el servicio centralizado; el texto se renderiza en `app.component` (`.global-loading-text`).
7. **Toda oleada de rendimiento o UX “prisa”** debe incluir loading en operaciones que tarden (red/RTDB): el usuario siempre ve que el sistema trabaja. Spec **005** + checklist QA.
8. Antes de entregar módulos/diálogos nuevos: `node scripts/check-loading-antipattern.mjs` (debe salir OK). Ese script solo detecta `show→dialogRef.close`; el anti-patrón post-éxito (regla 4) es revisión de código en flujos cobro/guardar.

### Checklist QA

- Tras guardar/cobrar: el overlay **desaparece**.
- Durante guardar: se lee «Guardando…»; durante cobro: «Cobrando…».
- Tras cobro exitoso: overlay apagado **antes** de Swal PDF/WhatsApp/imprimir o Web Share.
- Al abrir POS: «Cargando productos…» (overlay o hint inline) hasta el primer catálogo.
- En error de red/persistencia: overlay cierra + mensaje de error claro.
- Tras guardar desde «Llegó un paciente» (baño/vacuna/consulta/pensión): overlay **no** queda trabado.

Spec: `specs/005-loading-feedback-ux/`.

## REFERENCE IMPLEMENTATIONS

- **CRUD page:** `src/app/clientes/clientes.component.html` + `.scss`
- **Dialog detail:** `src/app/pacientes-admin/paciente-admin-dialog.component.html` + `.scss`
- **Handoff for external AI (archived, historical):** `docs/archive/ADMIN-UI-GEMINI-HANDOFF.md`

## KNOWN VIOLATIONS (migrate incrementally)

All admin dialogs now use `class="admin-dialog-title"` instead of `mat-dialog-title`. Legacy form layouts (historial-dialog, vacuna-dialog, usuario-dialog) still use custom CSS classes — migrate to `admin-dialog-shell` when refactoring those modules.

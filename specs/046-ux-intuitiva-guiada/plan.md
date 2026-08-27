# Plan: UX intuitiva guiada (046)

## Contratos de Datos y UI (Obligatorio)

### Walk-in (petshop sin cliente)

**Decisión MVP (implementada — opción A):**

Ticket con `esMostrador: true` y `cliente_id: '__mostrador__'` (sentinel). No crea Cliente RTDB. `syncSaldoCliente` ignora el sentinel. Staff write en rules OK sin cliente real.

| Nodo | Lectura | Escritura | Notas |
|------|---------|-----------|-------|
| `Katzen/Visitas` | staff | staff | `cliente_id?` o cliente mostrador; `esMostrador?` opcional |
| `Katzen/Banios` | staff | staff | sin cambio; guía UI exige cliente |
| `Katzen/Inventario/*` | staff | staff | salida con o sin paciente; `visitaId?` |
| `Katzen/Caja/Movimientos` | staff | staff | cobro walk-in sin clienteId o con mostrador |

**App móvil:** campos nuevos opcionales; no renombrar nodos.

### UI

| Pieza | Uso |
|-------|-----|
| Banner / hint inline | “Te falta el dueño…” + CTA |
| `app-admin-empty-state` | Empty con acción |
| `app-cliente-paciente-picker` | Paso 1 cuenta del día |
| `app-producto-picker` + grid 045 | Venta |
| Chips de pasos | Dueño → Líneas → Cobrar |
| SweetAlert | Solo confirmaciones, no para cada validación |
| Responsividad admin | Sidebar scroll; gutters ≤ tablet; grid productos con `max` card; diálogos ≤ viewport; toolbars flex wrap |

### Responsividad (ola 046)

- **Sin cambio RTDB** — solo CSS / layout.
- Mitigación: revertir `portal-shell.scss`, `admin-crud.scss`, `admin-dialog.scss`, `productos.component.css`, paneles.
- Rollback: redeploy hosting versión anterior.

### Copy canónico (español latino)

| Situación | Mensaje |
|-----------|---------|
| Baño sin dueño | “Primero elige o crea el dueño. Luego la mascota.” |
| Ticket sin líneas | “Incluye un baño pendiente, vende un producto o agrega una consulta.” |
| Cobrar sin saldo | “No hay saldo pendiente. Agrega líneas o ya está pagado.” |
| Walk-in | “Venta de mostrador (sin cliente). Puedes vincular un cliente después si quieres historial.” |
| Vincular cliente | “¿Es cliente de la clínica? Vincular a su cuenta del día.” |

## Archivos previstos (ola 1–2)

- `specs/046-ux-intuitiva-guiada/*` (esta carpeta)
- `visita-dialog` — pasos, hints, pendientes, producto (045)
- Helper copy / componente ligero `app-flow-hint` (opcional)
- `banios` diálogo — bloqueo suave sin cliente
- Productos — grid (045) + empty state
- `domain-context.md` — sección UX

## Plan de Mitigación y Rollback

- Solo UI + campos opcionales → revertir commits 045/046.
- Walk-in: si falla en prod rules, caer a cliente “Mostrador” (B) sin migrar datos.
- No deploy Firebase sin OK de Luis.

## Dependencias

- **045** aporta hub ticket + grid; **046** define el estándar y walk-in/guías.
- No bloquear 045 por walk-in: ola 1 puede exigir cliente; ola 2 abre mostrador.

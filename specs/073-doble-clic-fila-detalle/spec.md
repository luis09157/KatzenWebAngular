# Spec: Doble clic en fila = Ver detalle (tablas admin)

**ID:** 073-doble-clic-fila-detalle  
**Estado:** done  
**Fecha:** 2026-09-04  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  
**Nivel:** L2 (UI/lógica de listados admin; sin RTDB ni functions)  
**Relaciona:** **058** ficha rápida al doble clic (Directorio) · `docs/ADMIN-UI-ARCHITECTURE.md`

---

## Problema

En producción, al **doble clic** en una fila de `/admin/citas` no se abre el detalle; solo funciona el ícono ojo. El resto de listados admin no comparte una regla única: algunos ya abren ficha (clientes, directorio, productos), otros tienen `(dblclick)` incompleto (sin `stopPropagation` en acciones) y otros no hacen nada. La recepcionista espera el mismo gesto en toda la clínica.

---

## User stories

### US-1 — Doble clic abre el detalle

Como **staff (cualquier rol con acceso al módulo)**  
Quiero **doble clic en la fila de un listado admin**  
Para **abrir el mismo detalle que el ojo / Ver detalle**, sin buscar la columna ACCIONES

**Criterios de aceptación:**

- [x] SC-001: En `/admin/citas`, doble clic en `tr[mat-row]` abre el mismo diálogo que `verCita` (ojo «Ver detalle»).
- [x] SC-002: En listados admin con `mat-table` / `.table-scroll` que ya tienen ojo o `verDetalle` / equivalente, el `(dblclick)` de la fila llama **el mismo handler**.
- [x] SC-003: Un clic o doble clic en botones de `.row-actions` (ojo, editar, menú ⋮, WhatsApp, etc.) **no** dispara el detalle de la fila (`$event.stopPropagation()`).
- [x] SC-004: Filas con detalle: cursor `pointer` + `user-select: none` (el doble clic no selecciona texto). Leyenda del panel: **«Doble clic para ver detalle»**.
- [x] SC-005: Productos no se rompe: desktop doble clic = detalle; el ojo sigue visible; en móvil un clic puede abrir (el doble clic no es fiable).
- [x] SC-006: Documentado en `docs/ADMIN-UI-ARCHITECTURE.md` (sección tablas) y MUST en `.cursor/rules/admin-ui-architecture.mdc`.

---

## Fuera de alcance

- Inventar un diálogo de solo lectura donde hoy no existe (caja de finanzas, reportes, órdenes sin ficha, KPIs del dashboard).
- Cambiar el contrato de Directorio (**058**): doble clic sigue abriendo la **ficha**, no el expediente (carpeta).
- Portal de dueños, landing, tablas que no son admin.
- RTDB, rules, Cloud Functions, deploy.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno. Solo eventos de UI sobre handlers existentes.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | — | — | Sin cambios de datos |

- **Estrategia de Datos de Prueba:** mocks / sesión local en `http://localhost:4200`. Prohibido producción `katzen-a0e3e`.

- **Patrones UI Reutilizados:** `mat-table` + `.table-scroll` + `.row-actions` + `app-admin-data-panel` (leyenda). Diálogos existentes (`admin-dialog-shell`, **nunca** `mat-dialog-title`). Tokens `--katzen-verde` / `--admin-*`. Copy latino.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (todos los módulos que ya ve) |
| doctor | sí (módulos de su matriz) |
| recepcionista | sí (módulos de su matriz) |

No cambia `STAFF_MODULE_ACCESS`.

---

## UI (rutas y layout)

- Rutas afectadas: listados admin (`/admin/citas` obligatorio; clientes y el resto con detalle).
- Patrón: `tr[mat-row].data-row--interactive` `(dblclick)` → mismo método que el ojo.
- Leyenda: `app-admin-data-panel` → «Doble clic para ver detalle».

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md` sección Validación. L2: lint + `npm run build` + smoke 375/1280 (citas + al menos clientes) en `/tmp/kz-073/`.

---

## Notas / decisiones

- Tablas **sin** detalle (solo borrar, agregados, reportes, órdenes sin ficha): no se inventa `verDetalle`. Quedan listadas en `tasks.md`.
- Catálogos cuyo único opener es **Editar** (pensión, consentimientos, servicios, proveedores): doble clic = editar (abrir ficha de registro). No es un diálogo de solo lectura nuevo.
- Productos: un clic en desktop/móvil ya abre; el doble clic se ignora por el guard de 450 ms — no romper.

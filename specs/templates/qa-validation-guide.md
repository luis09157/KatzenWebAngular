# Guía de Pruebas y Validación Exhaustiva — KatzenVet

**Fuente única** de la checklist de validación pre-entrega. `AGENTS.md`, `.cursor/rules/sdd-workflow.mdc`, `constitution.md` y `README.md` solo enlazan aquí; no duplicar la lista en otros documentos.

**Entorno:** localhost, emuladores Firebase o mocks locales — **nunca** producción (`katzen-a0e3e`). Ver `specs/memory/constitution.md`.

---

## Rol del agente

**El agente corre las validaciones; Luis no es el QA por defecto.** No entregues pidiendo que Luis “pruebe y reporte”. Registra el resultado en `tasks.md` antes de marcar `[x]` (L2/L3).

## Qué aplicar según el nivel del cambio

Los niveles se definen en `.cursor/rules/sdd-workflow.mdc`. La validación es proporcional; no aplicar la guía completa a un cambio de padding.

| Nivel | Validación | Registro |
|-------|------------|----------|
| **L1 trivial** (CSS, copy, tooltip) | `npm run build` + 1 screenshot local (`:4200`) | Nota de una línea en la spec afectada si existe. Sin `tasks.md` |
| **L2 feature UI/lógica** | Unit tests del util + `npm run build` + smoke 375 / 1280 con mocks. Cypress **solo** si hay ruta nueva. De §1–§3 solo los ítems que la feature toca | Tabla de 5 filas de `module-tasks.template.md` (≤10 líneas) |
| **L3 datos/infra** (rules, functions, scripts a prod, modelos compartidos con móvil, imports) | **Esta guía completa** (§1–§5) + emulador Firebase + autorización explícita de Luis | Tabla completa (§4.3) en `tasks.md` + `plan.md` con Contratos de Datos / Rollback |

Ante duda, elegir el nivel superior.

---

## Checklist pre-entrega (L3 completo; L2 ítems aplicables)

| # | Acción | Evidencia |
|---|--------|-----------|
| 1 | Seguir esta guía (§1–§4) según nivel | Resultados en `tasks.md` |
| 2 | `npm run build` (exit 0) | Resumen reportado en `tasks.md` y al usuario |
| 3 | Servidor local vivo (`npm start` → http://localhost:4200) + smoke visual de lo tocado | Captura o simulación anotada |
| 4 | Registrar resultados en `tasks.md` **antes** de marcar `[x]` | Tabla QA rellenada |
| 5 | Reglas de UI recientes (si aplica — ver §2.4) | Filas OK / N/A en tabla QA |

---

## 1. Pruebas de formularios y validaciones de entrada

### 1.1 Campos vacíos

| Qué verificar | Criterio de éxito |
|---------------|-------------------|
| Envío con campos obligatorios vacíos | El sistema **bloquea** el envío |
| Retroalimentación visual | Bordes rojos, `mat-error` o mensajes claros en campos requeridos |
| Ejemplos típicos | Nombre de mascota, propietario, datos clínicos, fechas, selects obligatorios |

**Cómo probar:** intentar guardar/enviar el formulario sin completar cada campo obligatorio, uno por uno y todos a la vez.

### 1.2 Datos incorrectos / tipos erróneos

| Escenario | Qué observar |
|-----------|--------------|
| Letras en campos numéricos | Edad, peso, dosis, cantidades — debe rechazar o sanitizar |
| Símbolos extraños | `<script>`, emojis masivos, caracteres de control |
| Correo inválido | `usuario@`, `@dominio`, espacios |
| Teléfono inválido | Letras, longitud incorrecta, prefijos mal formados |

**Cómo probar:** ingresar valores inválidos en cada tipo de campo y confirmar que la validación impide persistir datos corruptos.

### 1.3 Límites y desbordamientos

| Escenario | Criterio de éxito |
|-----------|-------------------|
| Textos extremadamente largos | Notas, diagnósticos, observaciones (500+ caracteres) |
| Diseño responsivo | No rompe layout, tablas ni modales; scroll interno si aplica |
| Filtros / búsqueda en panel | `.panel-search` alineado con padding de la tabla; sin overflow ni desfase a la izquierda del card |
| Shells auth/portal/landing | Card/contenido **centrado y equilibrado** en desktop; full-width + padding en móvil; sin layout aplastado a un lado con hueco vacío |
| Truncamiento | Si hay límite de caracteres, se muestra contador o error antes de guardar |
| Chips/badges de estado | Pills (`.estado-badge`, etc.) se ven **completos** — sin borde derecho cortado por columna estrecha u `overflow:hidden` |
| Nombres de persona (tabla) | Chips/texto de veterinario, cliente, doctor, dueño se ven **completos** en desktop ancho; no truncar con "..." si hay espacio (`admin-table.scss`) |

---

## 2. Pruebas de interfaz, ventanas y modales

### 2.1 Apertura y cierre de diálogos

| Qué verificar | Criterio de éxito |
|---------------|-------------------|
| Abrir modal / diálogo | Se muestra correctamente (`admin-dialog-shell` en admin) |
| Cerrar con X, Cancelar, backdrop (si aplica) | Cierra limpiamente |
| Tras cerrar | **No** queda scroll lock ni backdrop colgado |
| Múltiples aperturas consecutivas | Sin acumulación de overlays |

**Componentes típicos:** formularios flotantes, confirmaciones de borrado, alertas Material.

### 2.2 Retroalimentación visual

| Tipo | Criterio de éxito |
|------|-------------------|
| Éxito | Toast/snackbar verde o mensaje según arquitectura UI (`ErrorMessagesService`, Material snackbar) |
| Error | Mensaje en tiempo y lugar correctos; contexto claro para el usuario |
| Timing | Aparece tras la acción, no antes ni duplicado |
| Loading contextual | Overlay con mensaje acorde: «Cargando…» / «Guardando…» / «Eliminando…» / «Actualizando…» (`LoadingService`) |
| Loading no trabado | Tras success **y** error el overlay **desaparece** (`finally` / `wrap`); sin doble `show` |

### 2.3 Prevención de doble submit

| Qué verificar | Criterio de éxito |
|---------------|-------------------|
| Primer clic en acción principal | Botón se **deshabilita** o muestra estado de carga (`mat-spinner`, `[disabled]`) |
| Clics rápidos repetidos | **Un solo** registro/actualización en Firebase (mock o emulador) |
| Botones afectados | "Guardar", "Registrar", "Confirmar cita", etc. |

### 2.4 Reglas de UI recientes (acordadas — verificar si aplica)

| Qué verificar | Criterio de éxito |
|---------------|-------------------|
| Chips/badges de estado | Se ven **completos** (no mochos); columna estado con overflow visible / ancho suficiente |
| Nombres de persona en tablas | En pantallas anchas se ven **completos** (veterinario, cliente, doctor, dueño); sin ellipsis si hay espacio. Medianas: wrap ≤2 líneas; estrecho: wrap + `.table-scroll` |
| Celdas multi-línea (fecha+hora, paciente+dueño) | Gap vertical **visible** (≈4–8px); no líneas pegadas por wrap sin aire |
| Layout admin desktop (≥1200px) | Contenido aprovecha ancho de `.admin-content`; columnas de texto flexibles; sin huecos raros (p. ej. entre veterinario y acciones) mientras el texto se ve comprimido |
| Filtros / búsqueda en `admin-data-panel` | Campo con `.panel-search` (o `.buscador.panel-search`); margen lateral alineado con el contenido de la tabla; **sin** overflow ni desfase visual a la izquierda del card |
| Shells auth / portal / landing | Coherente con design system; card centrada (V+H) en desktop; responsiva en móvil; **no** pegada a un borde con vacío grande |
| Diálogos picker / compactos | Usan `admin-dialog-shell--picker` (espaciado `--picker`); no CRUD grandes |
| Loading | Mensaje contextual + overlay **nunca** trabado (ver `specs/005-loading-feedback-ux/`) |
| Campos de hora | Usan `app-timepicker-field` + diálogo timepicker (no `type="time"` nativo) — `specs/004-timepicker-dialog/` |
| Acción destructiva (copy) | Labels visibles = **«Borrar»** (menú, tooltip, leyenda, SweetAlert). **No** «Baja lógica» / «Dar de baja». Técnico: sigue siendo soft-delete |
| Live preview | `npm start` vivo en :4200 al entregar cambios UI |
| Páginas admin (spec 061) | Grid 3→2→1 según ancho **útil**; toolbar wrap alineado; buscador sin clip; padding cards; timeline gap; smoke 375 / 768 / 1280 |

### 2.5 Layout de diálogos admin (spec 059 — permanente)

Aplica a **cualquier** diálogo/ventana admin (`*dialog*`, fichas, detalle). Causa raíz histórica: `:has(.entity-summary)` quitaba padding del body y `mat-tab-group` en overlay colapsaba el contenido (`height: 0`).

| Qué verificar | Criterio de éxito |
|---------------|-------------------|
| Padding del body | **No** se quita solo porque hay `.entity-summary`. `padding: 0` en `.admin-dialog-body` solo si hay layout interno (`.admin-dialog-layout`, `.admin-dialog-form--padded`, `.info-grid`) |
| Tabs (`mat-tab-group`) | Contenido visible: `height: auto` + `overflow: visible` en wrapper/content; preferir `dynamicHeight` si el contenido varía |
| Superficie del dialog | No recorta contenido: si el pane tiene `overflow: hidden`, el **body** debe poder scrollear (`overflow-y: auto`) |
| `.entity-summary` | Compacto (hueco ≈16px / 12px); no márgenes enormes entre hero y contenido |
| Responsive ~375px | Dueño/meta apilable; chips completos; sin layout aplastado a un lado |
| Fichas con tabs | Se ve el expediente/contenido (historial, vacunas, etc.), no solo el hero |
| Tipo de diálogo | Pickers usan `admin-dialog-shell--picker`; CRUD grandes usan shell estándar + `ADMIN_DIALOG_*` (ficha: `ADMIN_DIALOG_FICHA` + `admin-dialog-panel--ficha`) |

**Cómo probar:** abrir ficha paciente (dblclick Directorio) y al menos 3 diálogos con `.entity-summary` (cliente, cita o vacuna, usuario). Confirmar padding, scroll del body y tabs no colapsados. Desktop + viewport ~375px.

Spec: `specs/059-dialogos-admin-layout-responsivo/`. CSS canónico: `src/styles/admin-dialog.scss`.

### 2.6 Layout de páginas admin (spec 061 — permanente)

Aplica a **cualquier** pantalla admin (`.admin-page`, dashboards, expedientes, listados CRUD, POS si comparte shell). **No** es lo mismo que spec 059 (diálogos). Causa raíz histórica: grids de 3 columnas y `@media` de **viewport** ignoran el sidenav (~280px), así que el contenido se aplasta.

| Qué verificar | Criterio de éxito |
|---------------|-------------------|
| Grid de columnas | 3 → 2 → 1 según **ancho útil** de `.admin-content` (container `admin-page`). Nunca 3 cols si no caben con aire. Sin overflow horizontal de cards |
| Desktop ≥1200px | Si el útil lo permite, se aprovecha el ancho (regla 9); no “todo chiquito” ni huecos vacíos con texto aplastado |
| Toolbar / fila de botones | `flex-wrap` + gap; botones de la segunda línea alineados al **inicio** (no huérfanos). `matTooltip` below; no tapa la card de abajo |
| Buscador + «Nuevo» | Label/placeholder **completos** (no `…ar baño`). En estrecho el botón pasa debajo o a full width. `.panel-search` alineado si está en data-panel |
| Cards / paneles | Padding interno visible (≥16px; DUEÑO/acento ≥20px). Gap entre cards ≥16px (20–24px desktop) |
| Timeline / listas | Gap vertical scaneable (~8–12px); no ítems pegados |
| Viewports | Smoke **~1280**, **~900 / 768**, **~375**. En 1280/900 el sidenav sigue visible: el grid debe reaccionar al útil, no al viewport crudo |

**Cómo probar:** expediente paciente (`/admin/paciente`, p. ej. Oreon), dashboard `/admin/inicio` y un CRUD (clientes o citas). Redimensionar ~1280 / ~900 / ~375.

Spec: `specs/061-admin-paginas-layout-responsivo/`. CSS canónico: `src/styles/admin-page-layout.scss`.

---

## 3. Casos límite (edge cases) y errores de red

### 3.1 Red lenta o pérdida de conexión

| Escenario | Criterio de éxito |
|-----------|-------------------|
| Guardado con latencia simulada | UI muestra loading; no permite doble envío |
| Timeout / error de red | Mensaje de error comprensible; datos del formulario no se pierden sin aviso |
| Reintento | Usuario puede reintentar sin recargar toda la página |

**Cómo simular:** DevTools → Network → Slow 3G / Offline; o mocks de servicio que rechacen con `Observable` error.

### 3.2 Datos nulos o indefinidos desde Firebase

| Escenario | Criterio de éxito |
|-----------|-------------------|
| Nodo inexistente | Vista muestra estado vacío o mensaje, **no** pantalla en blanco |
| Propiedades opcionales ausentes | Sin `TypeError: Cannot read property 'x' of undefined` |
| Lista vacía | Tabla/lista con empty state, no crash de Angular |

**Cómo probar:** mocks con `{}`, `null`, arrays vacíos y objetos parciales (campos legacy omitidos).

---

## 4. Verificación de integridad final

### 4.1 Compilación TypeScript (obligatorio)

```bash
npm run build
```

| Criterio | Obligatorio |
|----------|-------------|
| Exit code 0 | Sí |
| Sin errores de tipado | Sí |
| Reportar en `tasks.md` | Sí — pegar resumen o confirmar OK |

Si también se modificaron Cloud Functions:

```bash
npm run functions:build
```

### 4.2 Servidor local + smoke visual (obligatorio en cambios UI)

1. Verificar `npm start` / `ng serve` en **http://localhost:4200**.
2. Si el proceso murió, reiniciarlo en background.
3. Hacer o simular smoke de las pantallas/diálogos tocados.
4. Confirmar al usuario la URL al entregar.

### 4.3 Registro en `tasks.md` (obligatorio antes de `[x]` en L2/L3)

Antes de marcar cualquier tarea de implementación o testing como completada:

1. Completar la sección **Validación** del `tasks.md` de la feature (L2: tabla de 5 filas de la plantilla; L3: plantilla de registro completa de abajo).
2. Anotar por escenario: **OK**, **N/A** (con motivo) o **FALLO** (con descripción).
3. Pegar output relevante de `npm run build` (o enlace a CI).
4. Solo entonces marcar `[x]`.

**Plantilla de registro:**

```markdown
### Resultados QA — [fecha o iteración]

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK / N/A / FALLO | ... |
| Formularios — tipos erróneos | OK / N/A / FALLO | ... |
| Formularios — límites texto | OK / N/A / FALLO | ... |
| UI — chips estado completos | OK / N/A / FALLO | ... |
| UI — nombres persona completos (desktop) | OK / N/A / FALLO | veterinario/cliente/etc. sin ellipsis en ancho |
| UI — celdas multi-línea (gap) | OK / N/A / FALLO | fecha+hora / paciente+dueño con gap visible |
| UI — layout ancho desktop | OK / N/A / FALLO | aprovecha `.admin-content`; sin huecos raros |
| UI — shells auth/portal centrados | OK / N/A / FALLO | card equilibrada desktop; responsiva; sin aplastar a un lado |
| Modales — apertura/cierre | OK / N/A / FALLO | ... |
| UI — diálogos --picker | OK / N/A / FALLO | ... |
| UI — timepicker en campos hora | OK / N/A / FALLO | ... |
| UI — diálogos spec 059 (padding/tabs/scroll) | OK / N/A / FALLO | no padding 0 por entity-summary; tabs visibles; body scrollea |
| UI — páginas spec 061 (grid/toolbar/search/padding/timeline) | OK / N/A / FALLO | 3→2→1 por útil; wrap alineado; search sin clip; DUEÑO padding; timeline gap; 1280/900/375 |
| UI — copy destructivo «Borrar» | OK / N/A / FALLO | menú/tooltip/leyenda/Swal; no «Baja lógica» |
| UI — retroalimentación | OK / N/A / FALLO | ... |
| UI — loading contextual | OK / N/A / FALLO | mensaje Guardando/Cargando/etc. |
| UI — loading no trabado | OK / N/A / FALLO | overlay desaparece tras guardar/error |
| UI — doble submit | OK / N/A / FALLO | ... |
| Edge — red lenta/error | OK / N/A / FALLO | ... |
| Edge — datos nulos RTDB | OK / N/A / FALLO | ... |
| Servidor local :4200 + smoke | OK / FALLO | ... |
| Build `npm run build` | OK / FALLO | exit code, errores si hay |
```

---

## 5. Cypress y pruebas E2E (cuando aplique)

Además de la validación manual/mockeada:

- [ ] `npm run cy:admin` — si la feature tocó rutas admin
- [ ] Spec E2E específico en `cypress/e2e/` — si se añadió o modificó

Documentar resultado en la sección **Testing** de `tasks.md`.

---

## 6. Checklist rápido para el agente

Antes de responder "tarea completada" / entregar al usuario:

- [ ] Leí esta guía (`specs/templates/qa-validation-guide.md`)
- [ ] Completé el **checklist pre-entrega** (§ arriba)
- [ ] Probé (o simulé con mocks) formularios, modales y edge cases **aplicables** a la feature
- [ ] Verifiqué chips completos, nombres de persona sin ellipsis en desktop ancho, `--picker`, loading contextual/no trabado, timepicker, copy destructivo «Borrar», **diálogos spec 059** y **páginas spec 061** (si aplica)
- [ ] Ejecuté `npm run build` y reporté resultado
- [ ] **Servidor local activo** (`npm start` → http://localhost:4200) + smoke visual; reiniciar si el proceso murió
- [ ] Registré resultados en `tasks.md` de la feature **antes** de marcar `[x]`
- [ ] Marqué `[x]` solo en ítems verificados
- [ ] No usé datos ni servicios de producción
- [ ] **No** delegué el QA al usuario como paso por defecto

---

## Referencias

- `specs/templates/module-tasks.template.md` — checklist ejecutable por feature
- `.cursor/rules/sdd-workflow.mdc` — flujo SDD + niveles de cambio L1/L2/L3
- `docs/ADMIN-UI-ARCHITECTURE.md` — patrones UI admin (modales, tablas, feedback, pickers, chips)
- `AGENTS.md` — comandos y restricciones del proyecto
- `specs/004-timepicker-dialog/` · `specs/005-loading-feedback-ux/` · `specs/059-dialogos-admin-layout-responsivo/` · `specs/061-admin-paginas-layout-responsivo/`

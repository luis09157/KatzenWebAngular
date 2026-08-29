# Plan técnico: Modo operación guiado

**Spec:** `specs/048-modo-operacion-guiado/spec.md`  
**Estado:** approved  

---

## Resumen

Extraer el patrón visual de hints de visita/baño en un componente **`app-flow-hint`** (SharedModule) con util compartido para mensajes dueño→mascota. Integrar hints contextuales en diálogos CRUD prioritarios y reforzar POS con copy + badge de impacto inventario. Empty states en pensión y consentimientos. **Solo frontend**, sin RTDB.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/shared/components/flow-hint/*` | crear | Componente + util |
| `src/app/shared/shared.module.ts` | modificar | Declarar/exportar FlowHint |
| `src/app/clientes/cliente-dialog.component.html` | modificar | Hint datos mínimos + portal |
| `src/app/pacientes/paciente-dialog.component.*` | modificar | Hint dueño primero |
| `src/app/citas/cita-dialog.component.*` | modificar | Hint dueño→mascota→agenda |
| `src/app/vacunas/vacuna-dialog.component.html` | modificar | Hint picker |
| `src/app/historiales/historial-dialog.component.*` | modificar | Hint picker |
| `src/app/recordatorios/recordatorio-dialog.component.html` | modificar | Hint picker |
| `src/app/banios/banio-dialog.component.*` | modificar | Migrar a app-flow-hint |
| `src/app/visitas/visita-dialog.component.*` | modificar | app-flow-hint + inventario |
| `src/app/visitas/visitas.component.html` | modificar | Copy POS |
| `src/app/pension/pension.component.html` | modificar | Empty state |
| `src/app/consentimientos/consentimientos.component.html` | modificar | Empty state |

### Firebase

| Archivo | Acción |
|---------|--------|
| — | sin cambios |

---

## Modelo de datos

Sin cambios RTDB.

---

## Flujos

### Flujo hint cliente → paciente

1. Si falta `cliente_id` (o equivalente por formulario): «Paso 1: selecciona o crea el dueño»
2. Si hay dueño pero falta paciente: «Paso 2: elige la mascota»
3. Paso siguiente según diálogo (fecha, vacuna, etc.)

### Flujo inventario en POS

1. Usuario agrega producto al ticket (`venta_producto`)
2. UI muestra hint: al **guardar o cobrar** se llama `registrarSalida`
3. Línea muestra badge «Descuenta inventario»

---

## Servicios

- `InventarioService.registrarSalida` — ya usado en `visita-dialog.asegurarSalidasProducto` (solo lectura de comportamiento para copy)

---

## UI (admin)

- Hint inline: `app-flow-hint` layout `inline`
- Hint footer (bloqueo acciones): layout `footer`
- Badge producto: `.estado-badge` variante muted/teal

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | — | ninguna | no | Solo UI |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** mocks + localhost. Prohibido `katzen-a0e3e`.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Flow hint | `visita-dialog`, `banio-dialog` (046) |
  | Diálogo CRUD | `admin-dialog-shell` |
  | Empty state | `app-admin-empty-state` (usuarios) |
  | Picker | `app-cliente-paciente-picker` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Badges visibles enteros

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [ ] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Hints rompen layout diálogo | Revertir HTML/SCSS del diálogo afectado |
| Componente flow-hint conflictúa estilos | Quitar export SharedModule y restaurar clases locales 046 |
| UI rompe build | Revertir archivos spec 048 |

---

## Deploy

Solo hosting si Luis lo pide — no requerido para esta entrega UI.

```bash
npm run build
```

---

## Riesgos

- Variantes de nombres de campo en formularios (`cliente_id` vs `idCliente`) — mitigado con util parametrizable.
- Encapsulation None en algunos diálogos — estilos en componente flow-hint con `:host`.

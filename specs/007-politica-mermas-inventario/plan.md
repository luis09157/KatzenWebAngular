# Plan técnico: Política de mermas / stock negativo

**Spec:** `specs/007-politica-mermas-inventario/spec.md`  
**Estado:** approved  

---

## Resumen

Extraer la lógica de cálculo/validación de stock a un util puro testeable; unificar el bloqueo de stock insuficiente para `salida` y `merma`; añadir `registrarMerma()` con motivo obligatorio; en UI, el motivo «Merma / Caducado» del diálogo de salida llama a `registrarMerma`; ajustes requieren rol supervisor ligero (`administrador` | `doctor` vía `staffRoleIsVeterinarioOperativo`). Sin cambios RTDB destructivos ni Cloud Functions.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/inventario/inventario-stock.util.ts` | crear | cálculo + validación stock/motivo |
| `src/app/inventario/inventario-stock.util.spec.ts` | crear | unit tests con mocks |
| `src/app/inventario/inventario.service.ts` | modificar | merma, motivo, ajuste supervisor |
| `src/app/inventario/movimientos/salida-dialog.component.ts` | modificar | merma → `registrarMerma`; LoadingService |
| `src/app/inventario/movimientos/salida-dialog.component.html` | modificar | copy merma / motivo obligatorio |
| `src/app/inventario/movimientos/ajuste-dialog.component.ts` | modificar | gate rol + LoadingService |
| `src/app/inventario/movimientos/movimientos.component.ts` | modificar | filtro merma; botón ajuste condicional |
| `src/app/inventario/movimientos/movimientos.component.html` | modificar | botón ajuste `*ngIf` |
| `src/app/inventario/dashboard-inventario/dashboard-inventario.component.ts` | modificar | mismo gate ajuste |
| `src/app/inventario/dashboard-inventario/dashboard-inventario.component.html` | modificar | si aplica |
| `src/app/core/error-messages.service.ts` | modificar | contextos merma / stock / autorización |
| `src/app/core/testing/mock-data.ts` | modificar | `MOCK_PRODUCTO_INVENTARIO` |

### Specs / docs

| Archivo | Acción |
|---------|--------|
| `specs/007-politica-mermas-inventario/*` | crear |
| `specs/memory/domain-context.md` | marcar #12 implementado (MVP) |
| `specs/AUDIT-CODE.md` | hallazgo #4 resuelto |
| `specs/README.md` / `ROADMAP.md` | índice |

### Firebase / Cypress

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | sin cambios |
| `functions/` | sin cambios |
| Cypress | sin ruta nueva — smoke existente basta |

---

## Modelo de datos

```text
Katzen/Inventario/Productos/{id}
  stock_actual: number     # nunca < 0 tras transacción web

Katzen/Inventario/Movimientos/{id}
  tipo: 'entrada' | 'salida' | 'ajuste' | 'merma' | ...
  motivo: string           # obligatorio en merma (y UI salida/ajuste)
  cantidad, cantidad_anterior, cantidad_nueva: number
  # sin campos nuevos requeridos
```

---

## Flujos

### Flujo merma (feliz)

1. Staff abre Salida → selecciona producto → motivo «Merma / Caducado» → cantidad ≤ stock
2. UI llama `registrarMerma(productoId, cantidad, motivo, observaciones)`
3. Servicio valida motivo; transacción resta stock; push movimiento `tipo: merma`
4. Alertas de stock bajo si aplica; SweetAlert éxito

### Flujo merma (stock insuficiente)

1. Cantidad > stock → UI bloquea y/o transacción aborta
2. Mensaje: stock disponible vs solicitado

### Flujo ajuste (supervisor)

1. Solo admin/doctor ven/usan «Ajuste»
2. Servicio rechaza si rol no es veterinario operativo

### Errores esperados

| Caso | Mensaje usuario |
|------|-----------------|
| Stock insuficiente | «Stock insuficiente. Disponible: X, Solicitado: Y» |
| Motivo vacío | «El motivo es obligatorio para registrar la merma» |
| Ajuste sin permiso | «Solo un supervisor (administrador o veterinario) puede registrar ajustes» |
| Producto no encontrado | «Producto no encontrado» |

---

## Servicios

- `InventarioService.registrarMerma` — nuevo
- `InventarioService.registrarMovimiento` — usa util stock
- `InventarioService.registrarAjuste` — gate rol
- `AuthProfileService.getEffectiveStaffRole` — autorización
- `LoadingService` + `LOADING_MESSAGES.saving`
- `ErrorMessagesService` — contextos nuevos

---

## UI (admin)

- Reutilizar diálogos existentes; sin módulo nuevo
- Loading «Guardando…» en merma/salida/ajuste
- Sin timepicker / chips de estado nuevos

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Inventario/Productos.stock_actual` | write transaccional existente | no | solo rechaza negativo |
  | `Katzen/Inventario/Movimientos` | push con `tipo: merma` | no | tipo ya en modelo |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales — N/A (sin campos nuevos)

- **Estrategia de Datos de Prueba:** mocks + `inventario-stock.util.spec.ts`; localhost; no producción.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Diálogo movimiento | `salida-dialog`, `ajuste-dialog` |
  | Alertas / errores | `ErrorMessagesService`, SweetAlert2 |
  | Loading async | `LoadingService` + `LOADING_MESSAGES.saving` |
  | Rol supervisor ligero | `staffRoleIsVeterinarioOperativo` (citas 003) |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips/badges — N/A en esta feature

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`) — al cerrar QA.
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe build | Revertir archivos de la feature 007 |
| Falso positivo en gate de ajuste | Relajar UI (mostrar botón) manteniendo validación o revertir gate |
| Merma mal tipada en histórico | Lecturas legacy siguen mostrando motivo en texto; sin migración |
| Reglas RTDB | Sin cambios — no aplica redeploy reglas |

---

## Deploy

```bash
npm run build
# Sin functions ni database rules
# hosting solo si Luis lo pide: firebase deploy --only hosting
```

---

## Riesgos

- Validación solo en cliente Angular (staff malicioso vía SDK puede saltarse UI) — mitigación real = reglas RTDB / Functions (fuera de alcance; AUDIT #1).
- Roles sin inventario en matriz UI no ven el módulo; el gate de ajuste protege si alguien llama al servicio.

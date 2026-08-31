# Plan técnico: Servicios de clínica

**Spec:** `specs/056-servicios-clinica/spec.md`  
**Estado:** approved  

---

## Resumen

Catálogo admin de **servicios con precio** (no stock) en nodo RTDB aditivo `Katzen/ServiciosClinica`. El POS riel Consulta los lista junto a vacuna/medicamento de inventario y cobra sin pedir monto si hay `precio_venta`. Baño permanece en Finanzas 022.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/servicios-clinica/` | crear | módulo lazy, modelo, util, service, lista, diálogo |
| `src/app/app-routing.module.ts` | modificar | ruta + StaffRoleGuard |
| `src/app/core/config/staff-role.config.ts` | modificar | `servicios-clinica` |
| `src/app/layouts/admin-main-layout.component.*` | modificar | menú Administración |
| `src/app/visitas/visita-dialog.component.*` | modificar | riel Consulta + hint baño |
| `src/app/visitas/visitas.models.ts` | modificar | `servicioClinicaId?` |
| `src/app/core/utils/precio-margen.util.ts` | modificar | `desglosarPrecioIvaIncluido` + snapshot línea (modelo IVA incluido) |
| `src/app/inventario/productos/*` | modificar | copy + ganancia neta; no suma IVA encima |
| `src/app/inventario/movimientos/salida-dialog.*` | modificar | cobro = `precio_venta`; desglose IVA/ganancia |
| `src/app/banios/banio-dialog.*` | modificar | lectura ganancia; no reescribe 022 |
| `src/app/core/testing/mock-data.ts` | modificar | mocks catálogo + costo/IVA |

### Firebase

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | nodo `Katzen/ServiciosClinica` staff-only |
| Functions | no |

### Cypress

| Archivo | Acción |
|---------|--------|
| `cypress/e2e/admin-modules-authenticated.cy.ts` | smoke ruta |

---

## Modelo de datos

```text
Katzen/ServiciosClinica/{id}
  nombre: string
  tipo: consulta | diagnostico | domicilio | otro
  precio_venta: number          # al público; incluye IVA si aplicaIva
  precio_costo?: number         # neto; lo que cuesta a la clínica
  aplicaIva?: boolean           # default lectura false (legacy); alta UI true
  tasaIva?: number              # %; default 16 si aplicaIva
  activo: boolean
  notas?: string
  sucursalId?: string
  created_at / updated_at / created_by?: string

Katzen/Visitas/{id}/lineas[]
  servicioClinicaId?: string
  costo?: number                # total línea (qty × costo unitario)
  precio_venta?: number         # unitario al público
  iva?: number                  # IVA trasladado de la línea
  ganancia?: number             # venta neta − costo
  aplicaIva?: boolean
  tasaIva?: number
```

**Modelo IVA:** precio al público **incluye IVA**. Costo neto. `ganancia = ventaNeta − costo`. Util compartido `desglosarPrecioIvaIncluido` en `precio-margen.util.ts` (no duplicar 022).

Baño **no** se escribe aquí.

---

## Flujos

### Flujo principal

1. Admin abre `/admin/servicios-clinica` → alta (consulta $400, ultrasonido, domicilio, honorarios).
2. Caja → riel Consulta → tap servicio con precio → línea en ticket sin prompt.
3. Vacuna/medicamento siguen saliendo de Inventario (055).
4. Baño: riel Peluquería + Finanzas 022.

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Sin permiso / reglas no desplegadas | permission-denied → lista vacía + error comprensible |
| Precio ≤ 0 en POS | fallback pedir monto |
| Nombre vacío | form inválido, no guarda |

---

## Servicios

- `ServiciosClinicaService` — CRUD RTDB `Katzen/ServiciosClinica` (lectura con `catchError` → `[]`)
- Sin callables

---

## UI (admin)

- Contenedor: `.servicios-clinica-contenedor`
- Shared: `app-admin-kpi-grid`, `app-admin-page-banner`, `app-admin-data-panel`, `app-flow-hint`, `app-admin-empty-state`
- Diálogo: `ADMIN_DIALOG_FORM` + `admin-dialog-shell`

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/ServiciosClinica` | nodo nuevo + campos opcionales costo/IVA | no | móvil no lo consume |
  | `Visitas.lineas[]` costo/iva/ganancia | campos opcionales | no | ignorados si ausentes; cobro no depende de ellos |
  | `Inventario/Productos` | sin cambiar nombres; UI desglose IVA incluido | no | `precio_compra` / `iva_aplicable` ya existen |
  | Banios / Finanzas 022 | no reescribir | no | solo lectura de ganancia en diálogo baño |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** mocks locales (`MOCK_SERVICIO_CLINICA_*`). Tests `servicios-clinica.util.spec.ts`. No conectar a prod para sembrar datos. Sin `firebase deploy` de esta ola.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Página CRUD | `src/app/pension/`, `src/app/clientes/` |
  | Diálogo | `admin-dialog-shell`, `ADMIN_DIALOG_FORM` |
  | Alertas / errores | `ErrorMessagesService`, SweetAlert2 |
  | Loading | `LoadingService` + `finally` |
  | Tabla acciones | `.row-actions` + `mat-icon-button` + `matTooltip` |
  | Badges | `.estado-badge` sin clip |
  | Guía | `app-flow-hint` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips/badges de estado visibles enteros

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local (`npm run build`) — registrar en tasks.
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe POS | Revertir `visita-dialog` + util; el atajo consulta 055 sigue igual |
| Reglas RTDB incorrectas | No se despliegan en esta ola; si se desplegaran: revertir `database.rules.json` + autorización Luis |
| Nodo con basura | Baja lógica `activo: false`; no borrar claves |
| permission-denied en localhost | Lista vacía; no se tocan Productos/Clientes/Pacientes |

---

## Deploy

**Esta ola: no deploy.** Hosting de precios POS es Fase 1 (ya salió). El catálogo queda en `main` para preview local.

Cuando Luis autorice:

```bash
npm run build
firebase deploy --only database   # reglas ServiciosClinica
firebase deploy --only hosting    # UI catálogo + POS
```

---

## Riesgos

- Localhost contra prod **sin** rules deploy: lectura/escritura denegada. UI debe degradar a vacío, no crashear.
- No sembrar servicios en prod desde el agente.

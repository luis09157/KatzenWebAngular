# Plan técnico: Costos y rentabilidad de clínica

**Spec:** `specs/021-costos-rentabilidad-clinica/spec.md`  
**Estado:** approved  

---

## Resumen

Extender el módulo `finanzas` (014/018) con: (1) plantillas de costo de servicio en `Katzen/Finanzas/PlantillasCosto`, (2) categoría + costo/margen en movimientos de caja, (3) dashboard día/mes legible para dueñas. Inventario solo clarifica labels de costo/venta/IVA. Sin CFDI, sin callables, sin tocar nodos móvil.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/finanzas/caja.models.ts` | modificar | categoria, costo, margen |
| `src/app/finanzas/caja.service.ts` | modificar | persistir campos; KPIs período |
| `src/app/finanzas/plantilla-costo.models.ts` | crear | tipos plantilla + ítems |
| `src/app/finanzas/plantilla-costo.service.ts` | crear | CRUD RTDB |
| `src/app/finanzas/plantilla-costo-dialog.component.*` | crear | diálogo plantilla |
| `src/app/finanzas/caja-movimiento-dialog.component.*` | modificar | categoría, plantilla, preview margen |
| `src/app/finanzas/finanzas.component.*` | modificar | tabs Caja / Costos / Rentabilidad |
| `src/app/finanzas/finanzas.module.ts` | modificar | MatTabsModule + declarations |
| `src/app/finanzas/caja-dialog.module.ts` | modificar | imports si hace falta |
| `src/app/banios/banios.component.ts` | modificar | `categoria` al abrir caja |
| `src/app/inventario/productos/producto-dialog.component.html` | modificar | labels Costo / venta / IVA hint |
| `src/app/core/testing/mock-data.ts` | modificar | mocks plantilla + caja con categoría |

### Firebase

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | `Katzen/Finanzas` staff R/W; indexOn `categoria` en Movimientos |

### Cypress / docs

| Archivo | Acción |
|---------|--------|
| `cypress/e2e/admin-crud-finanzas.cy.ts` | smoke tabs + categoría |
| `specs/ROADMAP.md` | 021 en Fase 6 |
| `specs/memory/domain-context.md` | § finanzas / backlog |
| `specs/README.md` | entrada 021 |

---

## Modelo de datos

```text
Katzen/Finanzas/PlantillasCosto/{id}
  nombre: string
  tipoServicio: 'banio' | 'corte' | 'cirugia' | 'consulta' | 'otro'
  precioSugeridoCliente?: number
  items: [{
    tipo: 'producto_inventario' | 'gasto_libre'
    productoId?: string
    nombre: string
    cantidad: number
    costoUnitario: number
  }]
  costoTotalEstimado: number   # suma cantidad * costoUnitario
  activo: boolean
  createdAt, updatedAt?, createdBy?

Katzen/Caja/Movimientos/{id}   # campos aditivos opcionales
  categoria?: 'banio' | 'corte' | 'cirugia' | 'venta_producto' | 'consulta'
            | 'publicidad' | 'operativo' | 'otro'
  plantillaCostoId?: string
  costoAsociado?: number
  margenEstimado?: number      # solo ingresos con costo; stamp al guardar
  # … campos 014 existentes sin cambio
```

---

## Flujos

### Alta plantilla

1. Tab Costos → Nueva plantilla → nombre + tipo + ítems (producto o libre)
2. Al elegir producto: sugerir `precio_compra` como `costoUnitario`
3. Guardar `costoTotalEstimado` calculado

### Cobro con margen

1. Registrar cobro → categoría + opcional plantilla / costo manual
2. Si ingreso y hay costo: `margenEstimado = monto - costoAsociado`
3. Baño→caja: `categoria: 'banio'` (o `corte` si tipo_servicio indica corte)

### Rentabilidad

1. Filtrar movimientos por día exacto o mes `YYYY-MM`
2. KPIs: ingresos, costos asociados (suma), egresos, margen estimado, neto (ingresos − egresos)

### Errores

| Caso | Mensaje |
|------|---------|
| Plantilla sin nombre / sin ítems | Validación formulario |
| Monto &lt; 0.01 | Ya existente |
| Lectura RTDB | ErrorMessagesService |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB:** solo aditivo; móvil no consume Caja/Finanzas.

  | Nodo / campo | Acción | ¿App móvil? | Notas |
  |--------------|--------|-------------|-------|
  | `Katzen/Finanzas/PlantillasCosto` | nuevo nodo | no | staff R/W |
  | `Caja/Movimientos.categoria` etc. | opcionales | no | defaults en lectura |
  | Inventario productos | sin cambio schema | no | labels UI |

  - [x] Sin eliminar ni renombrar nodos
  - [x] Campos nuevos opcionales

- **Pruebas:** `MOCK_PLANTILLA_COSTO`, `MOCK_CAJA_MOVIMIENTO` extendido — no prod.
- **Patrones UI:**

  | Patrón | Referencia |
  |--------|------------|
  | Página + KPIs + panel | `finanzas` / `clientes` |
  | Diálogos | `admin-dialog-shell` |
  | Loading | `LoadingService` contextual |
  | Acciones | `.row-actions` + «Borrar» |
  | Tabs | MatTabsModule (usuarios/pacientes) |

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos de contratos
- [ ] `npm run build` OK antes de entregar
- [ ] Rollback documentado

| Escenario | Rollback |
|-----------|----------|
| Rules Finanzas mal | revert `database.rules.json` + redeploy database |
| UI rompe finanzas | revert módulo `finanzas` (+ banios stamp categoría) + hosting |
| Datos basura | soft-delete plantillas/movimientos; no hard delete |

---

## Deploy

```bash
npm run build
firebase deploy --only database,hosting
```

Sin Functions. Solo con autorización explícita de Luis.

---

## Fase 2 (documentado, no implementar)

1. **SAT CFDI** — timbrado, series, cancelación, complemento pago
2. BOM cirugía desde historial + salidas inventario automáticas
3. Descuento stock al completar baño con productos → **022 Fase B**
4. Costo promedio ponderado en entradas
5. Reportes P&L anuales / por sucursal

### Seguimiento 022 (baños + automatización)

Ver `specs/022-automatizacion-costos-dashboard/`:

- **Config UI:** defaults costo (y precio sugerido opcional) por tamaño pequeño/mediano/grande
- **Fase A:** registro baño con override + precio por registro + prefill caja (`costoAsociado` / plantilla)
- **Fase B:** descuento inventario si plantilla trae productos clínicos

---

## Riesgos

- Movimientos legacy sin `categoria` → UI muestra «Sin categoría» / default `otro` al editar no aplica (solo alta)
- Doble conteo: egreso publicidad ≠ costoAsociado de un ingreso (KPIs separados)
- Float MXN — validar ≥ 0.01; mostrar 2 decimales

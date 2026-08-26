# Plan técnico: Automatización costos + dashboard gráficas

**Spec:** `specs/022-automatizacion-costos-dashboard/spec.md`  
**Estado:** draft  

---

## Resumen

Cerrar el hueco entre **inventario** y **caja** reutilizando hubs `/admin/finanzas` e `/admin/inventario`: (A) venta/baño con descuento de stock + movimiento de caja enlazado, más defaults de costo por tamaño de perro en baños; (B) consumo desde historial / plantilla cirugía; (C) gráficas y filtro semana en tab Rentabilidad; (D) categorías de egreso tipificadas (gasolina, proveedores, publicidad, generales). **Cero módulos admin nuevos.** RTDB estrictamente aditivo. Sin CFDI, sin Resend, sin romper contratos móvil.

---

## Análisis de lo existente (ajustar, no proliferar)

| Área | Hallazgo | Acción 022 |
|------|----------|------------|
| Finanzas tabs Caja / Costos / Rentabilidad | 021 completo sin charts | Extender Rentabilidad |
| Baño→caja | Manual; categoría OK; costo/plantilla no sistemáticos | Prefill costo + opt-in stock; defaults por tamaño |
| Salida inventario | Motivo `venta_directa` sin caja | Wire a ingreso |
| `registrarSalida(..., historialId)` | API lista; UI no | Exponer desde historiales |
| Categorías egreso | `publicidad` \| `operativo` \| `otro` | Añadir `gasolina`, `proveedores` |
| Dashboard inicio | **Sin card Finanzas** | Añadir card (SC-020) |
| Menú / breadcrumb | Labels `finanzas`/`banios` incompletos | Completar |
| Chart libs | Ninguna en `package.json` | Evaluar Chart.js / ng2-charts en Fase C |
| `Katzen/Venta` | Legacy | Ignorar |
| Medicamentos vs Inventario | Dos mundos | Consumo solo vía Inventario/Productos |

---

## Archivos a crear / modificar (por fase)

### Fase A — Wire baño / salida → caja (+ defaults tamaño)

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/finanzas/caja.models.ts` | modificar | `movimientoInventarioIds?`; categorías egreso si D va junto |
| `src/app/finanzas/caja.service.ts` | modificar | helper ingreso desde venta |
| `src/app/finanzas/caja-movimiento-dialog.component.*` | modificar | checkbox descontar plantilla |
| `src/app/inventario/movimientos/salida-dialog.component.*` | modificar | «Registrar en caja» si motivo `venta_directa` |
| `src/app/shared/inventario.models.ts` | modificar | `cajaMovimientoId?` en `Movimiento` |
| `src/app/inventario/inventario.service.ts` | modificar | persistir link; `costo_unitario` desde `precio_compra` |
| `src/app/banios/banios.component.ts` (+ diálogo alta) | modificar | tamaño → costo/precio sugerido; flag descontar al caja |
| `src/app/finanzas/*` (tab o diálogo) | crear/modificar | mini UI 3 defaults tamaño en hub finanzas |
| `src/app/dashboard/dashboard.component.ts` | modificar | card Finanzas en `allModules` |
| `src/app/core/testing/mock-data.ts` | modificar | mocks links + defaults baño |
| `cypress/e2e/admin-crud-finanzas.cy.ts` | modificar | smoke wire si aplica |
| `database.rules.json` | modificar | nodo defaults + campos opcionales |

### Fase B — Historial / kit cirugía

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/historiales/*` | modificar | «Consumir inventario» |
| `salida-dialog` con data prefill | modificar | `historial_clinico_id`, `paciente_id` |
| `caja-movimiento-dialog` | modificar | sugerir `costoAsociado` desde salidas del historial |
| `plantilla-costo` + flujo caja | modificar | descontar ítems (compartido A) |

### Fase C — Gráficas

| Archivo | Acción | Notas |
|---------|--------|-------|
| `package.json` | modificar | dep charts solo si se aprueba |
| `src/app/finanzas/finanzas.component.*` | modificar | filtro semana + charts en tab Rentabilidad |
| `src/app/finanzas/caja.service.ts` | modificar | agregaciones período / categoría |
| `src/app/dashboard/dashboard.component.*` (opcional) | modificar | mini KPIs |
| `src/app/dashboard/admin-layout.component.ts` | modificar | breadcrumb `finanzas` / `banios` |

### Fase D — Gastos tipificados

| Archivo | Acción | Notas |
|---------|--------|-------|
| `caja.models.ts` + diálogo + tabla + CSV | modificar | `gasolina`, `proveedores` + labels |
| `database.rules.json` | modificar | `indexOn` si aplica |

### Fase E (opcional)

| Archivo | Acción |
|---------|--------|
| `src/app/inventario/ordenes/*` (recibir) | checkbox egreso `proveedores` |

### Docs SDD (índice)

| Archivo | Acción |
|---------|--------|
| `specs/ROADMAP.md` | 022 en Fase 6 |
| `specs/README.md` | índice |
| `specs/memory/domain-context.md` | automatizaciones + egresos |

---

## Modelo de datos (aditivo)

```text
Katzen/Caja/Movimientos/{id}          # 014/021 + opcionales
  categoria?: ... | 'proveedores' | 'gasolina'
  movimientoInventarioIds?: string[]
  ordenCompraId?: string
  # banioId, plantillaCostoId, costoAsociado, margenEstimado ya 018/021

Katzen/Inventario/Movimientos/{id}
  historial_clinico_id?: string       # ya existe
  cajaMovimientoId?: string           # nuevo opcional

Katzen/Banios/{id}
  tamano_perro?: 'pequeno' | 'mediano' | 'grande'
  costoEstimado?: number
  plantillaCostoId?: string
  cajaMovimientoId?: string           # ya 018

Katzen/Finanzas/DefaultsBanioPorTamano
  pequeno | mediano | grande:
    { costoDefault: number, precioSugerido?: number, plantillaCostoId?: string }

Katzen/Finanzas/PlantillasCosto/{id}  # sin breaking (021)
```

**Transacción venta (orden sugerido):** 1) validar stock → 2) salida inventario → 3) ingreso caja → 4) links bidireccionales → 5) si falla 3, no confirmar / compensar.

---

## Flujos

### A — Venta croquetas

1. Inventario → Salida → `venta_directa` → cantidad  
2. Checkbox «Registrar cobro en caja» (ON) → monto `precio_venta × cant.`  
3. Guardar → stock − + ingreso `venta_producto`  

### A — Baño con tamaño + insumos

1. Alta/edición baño: tamaño → prefill costo/precio sugerido (override libre)  
2. «Registrar en caja» arrastra monto, categoría, costo, plantilla  
3. Checkbox «Descontar productos de la plantilla» → salidas por ítem  

### B — Cirugía

1. Historial → Consumir inventario  
2. Cobrar `categoria: cirugia` → costo desde salidas ligadas y/o plantilla  

### D — Gasolina / publicidad

1. Finanzas → Egreso → Gasolina | Publicidad | Proveedores | Gastos generales (`operativo`)  

### C — Dashboard

1. Tab Rentabilidad → Día | Semana | Mes  
2. Barras ingresos vs egresos + desglose egresos por categoría + KPI neto/margen  

### Errores

| Caso | Mensaje usuario |
|------|-----------------|
| Stock insuficiente | Regla 007 — no crear caja |
| Doble cobro baño | Swal 018 |
| Plantilla sin stock en un ítem | Listar productos; no a medias sin confirmar |
| Historial sin consumos | Costo manual / plantilla |
| Chart sin datos | Empty state admin |

---

## Servicios

- `CajaService` — crear desde venta; KPIs semana; series charts  
- `InventarioService.registrarSalida` — + `cajaMovimientoId`  
- Bridge fino opcional si hay ciclos de módulos  
- Servicio defaults baño por tamaño (CRUD mínimo 3 filas)  
- Sin callable MVP  

---

## UI (admin)

| Patrón | Referencia |
|--------|------------|
| Página + tabs | `finanzas.component` |
| Diálogos | `admin-dialog-shell`, `ADMIN_DIALOG_*` |
| KPIs | rent-cards 021 |
| Acciones | `.row-actions`, «Borrar» |
| Loading | `LoadingService` contextual |
| Charts | Dentro tab Rentabilidad; tokens Katzen |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB:** solo aditivo; móvil no consume Caja/Finanzas.

  | Nodo / campo | Acción | ¿App móvil? | Notas |
  |--------------|--------|-------------|-------|
  | Caja links + categorías | opcionales | no | |
  | Inventario `cajaMovimientoId` | opcional | ignorable | |
  | Banios tamaño/costo | opcionales | compat | |
  | `DefaultsBanioPorTamano` | nuevo | no | |
  | PlantillasCosto | sin break | no | |

  - [x] Sin eliminar/renombrar nodos  
  - [x] Campos nuevos opcionales  

- **Pruebas:** `src/app/core/testing/mock-data.ts` + emuladores; **prohibido** RTDB prod.  
- **UI:** `docs/ADMIN-UI-ARCHITECTURE.md`  
  - [ ] Charts = única excepción analítica  
  - [ ] Chips categoría sin clip  

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos de contratos  
- [ ] `npm run build` OK por fase antes de merge  
- [x] Rollback documentado  

| Escenario | Rollback |
|-----------|----------|
| Wire venta inconsistente | Revert Fase A; soft-delete; ajuste stock supervisor |
| Chart lib rompe bundle | Quitar dep; KPIs 021 |
| Categorías nuevas rompen CSV | Map unknown → «Otro» |
| Rules | Revert `database.rules.json` + redeploy (auth Luis) |

---

## Deploy (solo con autorización Luis)

```bash
npm run build
# si rules:
firebase deploy --only database
firebase deploy --only hosting
```

Sin Functions en MVP. Sin Resend.

---

## Dependencias entre fases

```text
A (wire + defaults baño) ──┬──► B (historial)
                           ├──► D (categorías egreso)   # paralelo OK
                           └──► C (gráficas)            # tras datos caja útiles
E (OC egreso) tras D
```

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Doble cobro / doble salida | Links + checkbox; Cypress |
| Race stock | Transacción RTDB inventario |
| Proliferación UI | Spec prohíbe rutas nuevas; checklist PR |
| Semana ambigua | Hint UI: lun–dom clínica |
| Bundle charts | Lazy load tab |
| Medicamento catálogo ≠ stock | Copy: «elige producto de inventario» |

---

## Criterio de listo para Luis (plan)

1. Acepta **no** crear módulos Gastos / Ventas / Dashboard / Pensión en 022  
2. Acepta orden A→B→C→D (o pide reordenar C antes de B)  
3. Confirma categorías egreso: publicidad, proveedores, gasolina, generales (`operativo`)  
4. Confirma defaults baño por tamaño dentro de Fase A (sub), no como producto aparte  
5. Confirma CFDI y Resend fuera  

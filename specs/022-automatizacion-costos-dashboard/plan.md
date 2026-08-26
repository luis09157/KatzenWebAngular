# Plan técnico: Automatización costos / ops financieras + pensión

**Spec:** `specs/022-automatizacion-costos-dashboard/spec.md`  
**Estado:** in-progress  
**Extiende:** 014, 018, 021  

---

## Resumen

Implementar el puente **Inventario (valuación) ↔ Banio (tamaño/costo) ↔ Caja/margen ↔ P&L**, y diseñar **pensión** como módulo nuevo en Fase B. Principio: hub Finanzas + Inventario + eventos que emiten movimientos económicos. **Sin ventanas redundantes.**

---

## Fases A → D (implementación)

| Fase | Alcance código | Deploy típico |
|------|----------------|---------------|
| **A (ahora)** | KPIs valuación inventario; defaults baño P/M/G; Banio campos aditivos; baño→caja con `costoAsociado`; card Finanzas; wire venta→caja (si tiempo) | hosting (+ database si rules) |
| **B** | Consumo historial/cirugía/vacuna; módulo pensión MVP (lista/alta/caja); StaffModule | hosting + database rules Pension |
| **C** | Gráficas tab Rentabilidad + filtros semana | hosting |
| **D** | Egresos tipificados (gasolina, proveedores, …) | hosting |
| **E** | OC → egreso opt-in | hosting |

**Pensión:** diseño completo abajo; **código en B** (no bloquea A). Si A cierra y hay capacidad, scaffolding mínimo lista+alta opcional — prioridad: cerrar A con QA.

---

## Contratos de Datos y UI (Obligatorio)

### Impacto RTDB

| Nodo / campo | Acción | ¿App móvil? | Notas |
|--------------|--------|-------------|-------|
| `Inventario/Productos` | solo lectura agregada | ignora | KPIs client-side |
| `Finanzas/DefaultsBanioPorTamano` | **nuevo** | no | 3 keys tamaño |
| `Banios.tamano_perro?`, `costoEstimado?`, `plantillaCostoId?` | opcionales | ignora | safe |
| `Caja/Movimientos` | campos existentes + links A | no | `costoAsociado` ya 021 |
| `Inventario/Movimientos.cajaMovimientoId?` | opcional A | no | |
| `Caja/Movimientos.movimientoInventarioIds?` | opcional A | no | |
| `Pension/Estancias/{id}` | **nuevo B** | no | |
| `Finanzas/DefaultsPensionPorTamano` | **nuevo B** | no | |

- [x] Sin eliminar ni renombrar nodos  
- [x] Campos nuevos opcionales  

### Pruebas

Mocks locales (`mock-data.ts`); Cypress smoke; **nunca** producción (`katzen-a0e3e`).

### Patrones UI

`admin-page`, `app-admin-kpi-grid`, `admin-dialog-shell`, `LoadingService` contextual, copy «Borrar», chips completos, `--picker` solo diálogos compactos.

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos de contratos  
- [ ] `npm run build` OK antes de entregar código Fase A  
- [x] Rollback documentado  

| Escenario | Rollback |
|-----------|----------|
| KPIs invent. confunden | revert labels + campos stats; hosting |
| UI baños rompe alta | revert diálogo baños + hosting |
| Defaults mal | editar nodo o soft-ignore lectura |
| Rules Pension (B) | revert `database.rules.json` |
| Módulo pensión inestable | feature-flag ruta / quitar menú |

---

## 1. Inventario financiero (Fase A)

### Modelo / cálculo

```ts
// EstadisticasInventario (extender)
valor_total_inventario: number;      // = invertido_costo (compat)
invertido_costo: number;             // Σ stock * precio_compra
valor_precio_venta: number;          // Σ stock * precio_venta
margen_potencial: number;            // valor_venta - invertido
```

### Archivos

| Archivo | Acción |
|---------|--------|
| `shared/inventario.models.ts` | extender `EstadisticasInventario` |
| `inventario/inventario.service.ts` | `getEstadisticas` calcula 3 métricas |
| `dashboard-inventario.component.html` | 3–4 KPI cards claras (renombrar «Valor» → «Invertido») |
| `finanzas.component` (opcional A) | mini resumen stock en Rentabilidad |

### UI copy

- «Invertido (a costo)»  
- «Valor a precio de venta»  
- «Margen potencial (stock)»  
Hint: no es COGS realizado ni utilidad de caja.

---

## 2. Baños: defaults + enlace caja (Fase A)

### Tabla operativa

| Campo | Default configurable | Override al registrar | Efecto |
|-------|----------------------|------------------------|--------|
| `tamano_perro` | — | Sí | Índice defaults |
| `costoEstimado` | costoDefault P/M/G | Sí | `Caja.costoAsociado` |
| `precioSugerido` → prefill `precio_total` | Sí | N/A (hint) | No cierra caja |
| `precio_total` | Prefill | **Sí, siempre** | `Caja.monto` |
| `plantillaCostoId` | Opcional por tamaño | Sí | Stamp + margen |
| `cajaMovimientoId` | — | Flujo 018 | Link 1:1 |

### RTDB defaults

```text
Katzen/Finanzas/DefaultsBanioPorTamano
  pequeno:  { costoDefault, precioSugerido?, plantillaCostoId? }
  mediano:  { … }
  grande:   { … }
  updatedAt?, updatedBy?
```

### Archivos

| Archivo | Acción |
|---------|--------|
| `finanzas/defaults-banio.models.ts` | crear |
| `finanzas/defaults-banio.service.ts` | crear |
| `finanzas/finanzas.component.*` | panel 3 filas |
| `shared/banio.model.ts` | campos aditivos |
| `banios/banio-dialog.component.*` | tamaño + prefill + override |
| `banios/banios.component.ts` | `registrarEnCaja` pasa costo/plantilla |
| `caja-movimiento-dialog` | ya acepta `costoAsociado` — verificar prefill |
| `core/testing/mock-data.ts` | mocks |
| `dashboard.component.ts` | card Finanzas |

### Regla costo

1. Si usuario elige plantilla → `costoEstimado` = costo plantilla (editable).  
2. Si no → default por tamaño.  
3. Override manual siempre gana al guardar.

---

## 3. Venta producto → caja (Fase A, si cabe en misma entrega)

| Archivo | Acción |
|---------|--------|
| `salida-dialog.component.*` | checkbox «Registrar en caja»; abre `CajaMovimientoDialog` |
| `caja.models` / create | `movimientoInventarioIds?` |
| Inventario movimiento | stamp `cajaMovimientoId?` |

Anti-doble: si falla caja tras salida, mensaje + opción reintentar link (no revertir stock automáticamente en MVP — documentar).

---

## 4. Cirugías / vacunas / historial (Fase B — diseño)

```text
Historial → «Consumir inventario»
    → registrarSalida(..., historial_clinico_id)
    → lista consumos del historial
Cobro caja (cirugía/consulta/vacuna)
    → costoAsociado sugerido = Σ salidas ligadas | plantilla
    → opt-in descontar ítems plantilla restantes
```

Vacunas: el módulo `/admin/vacunas` sigue siendo registro clínico; **stock** vía producto inventario + consumo (no duplicar catálogo Medicamentos).

Archivos previstos B: `historiales` UI consume; `salida-dialog` prefill historialId; plantillas tipo `cirugia`.

---

## 5. Alojamiento / pensión (módulo nuevo — diseño A; código B)

### Justificación módulo nuevo

Lifecycle propio (check-in/out, días, tarifa/día, tamaño) ≠ baño ni cita. Encaja menú admin + `StaffModule` como baños.

### Modelo propuesto

```text
Katzen/Pension/Estancias/{id}
  paciente_id, cliente_id
  fecha_ingreso, fecha_salida_prevista?, fecha_salida_real?
  tamano_mascota: pequeno|mediano|grande
  precio_dia, costo_estimado?, precio_total?   # total override al cobrar
  costo_dia?, costo_total_estimado?
  estado: reservada|activa|finalizada|cancelada
  notas?, cajaMovimientoId?, plantillaCostoId?
  activo, created_at, updated_at, created_by

Katzen/Finanzas/DefaultsPensionPorTamano
  pequeno|mediano|grande: { precioDia, costoDia?, plantillaCostoId? }
```

### CRUD / UI B

| Pieza | Detalle |
|-------|---------|
| Ruta | `/admin/pension` lazy module |
| StaffModule | `'pension'` en type + ALL + menú layout |
| Lista | KPI grid + banner + tabla (paciente, fechas, días, total, estado, acciones) |
| Alta/editar | `admin-dialog-shell`; tamaño → defaults; override precio/día y total |
| Cobrar | «Registrar en caja» (patrón baños 018) categoría `pension` |
| Inventario | Opt-in: plantilla comida / salida alimentos (fase B+ o C) |
| Cypress | entrada en `admin-modules-authenticated.cy.ts` |
| Rules | `Katzen/Pension`: staff auth R/W; no cliente portal |

### Fase implementación pensión

| Subfase | Qué |
|---------|-----|
| Docs (A) | Spec + plan + domain-context + ROADMAP |
| B1 | Nodo + rules + service + lista + alta mínima + menú |
| B2 | Cobro caja + defaults tamaño |
| B3 | Opt-in comida inventario |

**No implementar pensión en Fase A** salvo scaffolding vacío si A termina con holgura (preferir no).

---

## 6. Extensibilidad (arquitectura)

```text
TipoServicio (catálogo labels)
    banio | corte | cirugia | vacuna | consulta | pension | venta_producto | otro

EventBus implícito (sin framework):
  pantalla dominio → CajaService.crearMovimiento + opcional InventarioService.salida
```

Agregar tipo futuro:

1. Label en `CAJA_CATEGORIA_LABELS` + opcional `PlantillaTipoServicio`  
2. Evento en pantalla existente **o** módulo si hay CRUD operativo  
3. No crear dashboard paralelo  

---

## 7. Encaje 014 / 018 / 021

```text
[Inventario KPIs valuación]                    ← 022 A
[DefaultsBanioPorTamano] → [Banio] → [Caja]   ← 018/021/022 A
[Salida venta] → [Caja]                         ← 022 A
[Historial consumo] → [Caja cobro]              ← 022 B
[Pension Estancia] → [Caja]                     ← 022 B
[Rentabilidad gráficas]                         ← 022 C
[Egresos tipificados]                           ← 022 D
```

---

## 8. CRUD mapa (resumen plan)

Ver tabla completa en `spec.md`. Decisiones clave:

- **Extender:** caja, plantillas, baños, movimientos inv., finanzas defaults  
- **Nuevo:** pensión (B), defaults pensión (B)  
- **No crear:** gastos, ventas POS, dashboard finanzas aparte  

---

## Deploy (solo con autorización Luis)

```bash
npm run build
# Fase A:
firebase deploy --only hosting
# Si rules Finanzas/Pension:
firebase deploy --only database,hosting
```

Resend: **diferido**. Functions: no requeridas en A.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Confundir margen potencial stock con utilidad caja | Copy UI explícito |
| Baños legacy sin tamaño | Cobro sigue; margen N/D |
| Doble fuente costo (plantilla vs tamaño) | Regla prioridad documentada |
| Pensión scope creep | B1 mínimo; comida en B3 |
| Venta→caja falla a medias | Mensaje + no doble cobro; links |

# Plan técnico: Automatización costos / dashboard + baños por tamaño

**Spec:** `specs/022-automatizacion-costos-dashboard/spec.md`  
**Estado:** draft  

---

## Resumen

Documentar e implementar (cuando Luis autorice código) el puente **Banio → costo por tamaño → caja/margen → P&L**, reutilizando 014/018/021. Primero **config de defaults** por tamaño; luego **Fase A** de automatización al registrar/cobrar. Inventario por plantilla queda diseñado, sin código hasta subtarea explícita. **Esta entrega inicial es solo documentación.**

---

## Baños: defaults por tamaño + precio por registro + enlace finanzas

### Tabla operativa (campo → comportamiento)

| Campo | Default configurable | Override al registrar | Efecto finanzas / inventario |
|-------|----------------------|------------------------|------------------------------|
| `tamano_perro` | — | Sí (obligatorio en flujo nuevo) | Índice del catálogo de defaults |
| `costoDefault` → `Banios.costoEstimado` | Sí (pequeño/mediano/grande) | Sí | `Caja.costoAsociado` + margen P&L |
| `precioSugerido` → prefill `precio_total` | Sí (opcional) | N/A (solo hint) | No cierra caja; usuario confirma precio |
| `precio_total` | Prefill si hay sugerido | **Sí, siempre por registro** | `Caja.monto` ingreso |
| `plantillaCostoId` | Opcional por tamaño/`tipo_servicio` | Sí | Stamp baño + movimiento; futuro stock |
| `cajaMovimientoId` | — | Flujo cobro 018 | Link 1:1 Banio↔Movimiento |
| Ítems inventario plantilla | En `PlantillasCosto` | Futuro | Salida stock (post-MVP) |

### Fases claras

| Fase | Qué incluye | Qué no incluye | Dependencias |
|------|-------------|----------------|--------------|
| **Docs (ahora)** | Spec + plan + tasks + índice ROADMAP/README/domain | Código UI/RTDB | — |
| **Config UI** | CRUD/lectura de defaults por tamaño en Finanzas (o panel config baños); mocks | Auto-caja, inventario | Nodo RTDB aditivo + rules (si hace falta) |
| **Fase A — automatización enlace** | Diálogo baño: tamaño → prefill costo/precio sugerido + override; «Registrar en caja» arrastra `costoAsociado` / plantilla / monto; dashboard 021 refleja sin cambios estructurales | Descuento stock; CFDI; forzar precio fijo | Config UI (defaults) + 018/021 ya en prod |
| **Fase A+ (opcional)** | Egresos tipificados extra; gráficas simples en Rentabilidad | Módulos nuevos | Fase A |
| **Fase B — inventario (futuro)** | Al completar/cobrar baño con plantilla: salidas inventario por ítems `producto_inventario`; wire venta→stock | Mezclar `ProductosPeluqueria` con stock clínico | 021 plantillas + inventario movimientos |
| **Fase C** | Consumo desde historial clínico | — | Backlog medicamentos controlados |

**Orden recomendado:** Config UI → Fase A (baños) → A+ / B según prioridad Luis.

---

## Encaje con 014 / 018 / 021

```text
[Config DefaultsBanioPorTamano]     ← 022 Config UI
         │
         ▼
[Banio alta] tamano + costoEstimado + precio_total (override)
         │
         │  018 registrarEnCaja
         ▼
[Caja Movimiento] monto ← precio_total
                  categoria ← banio|corte
                  costoAsociado ← costoEstimado
                  plantillaCostoId ← opcional
                  banioId / Banio.cajaMovimientoId
         │
         ▼
[Rentabilidad 021] ingresos / costos / margen día|mes
```

- **014:** caja MVP intacta; solo más datos prellenados.
- **018:** mismo botón/flujo; enriquecer `data` del diálogo.
- **021:** plantillas siguen siendo BOM; defaults por tamaño son atajo de **costo total** (pueden coexistir: si hay plantilla, costo = `costoTotalEstimado` plantilla o override; si no, default por tamaño).

### Modelo de datos propuesto (aditivo)

```text
Katzen/Finanzas/DefaultsBanioPorTamano
  pequeno:  { costoDefault: number, precioSugerido?: number, plantillaCostoId?: string }
  mediano:  { costoDefault: number, precioSugerido?: number, plantillaCostoId?: string }
  grande:   { costoDefault: number, precioSugerido?: number, plantillaCostoId?: string }
  updatedAt?, updatedBy?

Katzen/Banios/{id}   # campos opcionales nuevos
  tamano_perro?: 'pequeno' | 'mediano' | 'grande'
  costoEstimado?: number
  plantillaCostoId?: string
  # existentes: precio_base, precio_total, cajaMovimientoId, tipo_servicio, …
```

Compatibilidad: lectura trata ausentes como «sin tamaño / sin costo» (margen N/D como en 021).

---

## Archivos a crear / modificar (cuando se implemente)

### Angular — Config UI

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/finanzas/defaults-banio.models.ts` | crear | tipos tamaño |
| `src/app/finanzas/defaults-banio.service.ts` | crear | CRUD nodo defaults |
| `src/app/finanzas/finanzas.component.*` | modificar | UI catálogo 3 filas |
| `src/app/core/testing/mock-data.ts` | modificar | `MOCK_DEFAULTS_BANIO_TAMANO` |

### Angular — Fase A

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/shared/banio.model.ts` | modificar | campos aditivos |
| `src/app/banios/banio-dialog.component.*` | modificar | tamaño, costo, precio sugerido, override |
| `src/app/banios/banios.component.ts` | modificar | `registrarEnCaja` pasa costo/plantilla |
| `src/app/finanzas/caja-movimiento-dialog.component.*` | modificar | aceptar prefill costo/plantilla desde baño |

### Firebase

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | confirmar `Katzen/Finanzas/**` staff R/W (ya 021) |

### Cypress / docs

| Archivo | Acción |
|---------|--------|
| `cypress/e2e/...` | smoke defaults + baño→caja con costo |
| `specs/memory/domain-context.md` | § Banios + Finanzas |
| `specs/ROADMAP.md` / `README.md` | entrada 022 |

---

## Flujos

### Config (una vez)

1. Admin abre Finanzas → Defaults baño por tamaño.
2. Edita costo (y opcional precio sugerido / plantilla) para pequeño/mediano/grande.
3. Guarda nodo `DefaultsBanioPorTamano`.

### Alta baño (Fase A)

1. Usuario elige paciente + **tamaño**.
2. Sistema prellena `costoEstimado` y opcionalmente `precio_total` desde defaults.
3. Usuario ajusta costo y **siempre** confirma/edita `precio_total`.
4. Guarda Banio (campos aditivos).

### Cobro → finanzas

1. «Registrar en caja» (018): prefill monto, categoría, costoAsociado, plantillaCostoId, banioId.
2. Usuario confirma IVA/método; guarda movimiento; stamp `cajaMovimientoId`.
3. Tab Rentabilidad 021 incluye el ingreso y el costo.

### Errores

| Caso | Mensaje |
|------|---------|
| Sin tamaño en flujo nuevo | Validación: elegir tamaño |
| Costo default faltante en config | Usar 0 o pedir captura manual; no inventar margen falso |
| Ya hay `cajaMovimientoId` | Aviso 018 (no doble cobro) |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB:** solo aditivo; móvil no requiere cambios.

  | Nodo / campo | Acción | ¿App móvil? | Notas |
  |--------------|--------|-------------|-------|
  | `Katzen/Finanzas/DefaultsBanioPorTamano` | nuevo | no | staff |
  | `Banios.tamano_perro`, `costoEstimado`, `plantillaCostoId` | opcionales | ignora si no usa | safe |
  | Caja / PlantillasCosto | sin breaking | no | reuso 021 |

  - [x] Sin eliminar ni renombrar nodos
  - [x] Campos nuevos opcionales

- **Pruebas:** mocks locales; emuladores si se tocan rules; **nunca** prod.
- **Patrones UI:** `admin-dialog-shell`, tabs finanzas, baños CRUD, `LoadingService`, «Borrar» solo si aplica baja lógica de config (no borrar tamaños: editar valores).

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos de contratos (docs-only ahora)
- [ ] `npm run build` OK antes de entregar **código** Fase Config/A
- [x] Rollback documentado

| Escenario | Rollback |
|-----------|----------|
| UI baños rompe alta | revert diálogo baños + hosting |
| Defaults mal | editar nodo o soft-ignore (lectura sin defaults) |
| Rules Finanzas | revert `database.rules.json` |

---

## Deploy (solo con autorización Luis)

```bash
npm run build
firebase deploy --only database,hosting   # si hubo rules + UI
```

Sin Functions en MVP 022.

---

## Riesgos

- Baños legacy sin `tamano_perro` / `costoEstimado` → cobro sigue funcionando; margen N/D hasta editar.
- Confusión precio sugerido vs precio_total → copy UI claro: «Precio cobrado (este baño)».
- Doble fuente de costo (plantilla vs default tamaño) → regla: plantilla gana si se elige; si no, default tamaño; override manual siempre gana al guardar.
- `ProductosPeluqueria` ≠ inventario clínico — no descontar stock peluquería legacy en Fase B sin decisión explícita.

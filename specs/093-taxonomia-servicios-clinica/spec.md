# Spec: Taxonomía de servicios de clínica (tipo + domicilio)

**ID:** 093-taxonomia-servicios-clinica  
**Estado:** done  
**Fecha:** 2026-10-04  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Relaciona:** 056 servicios-clinica (catálogo + POS riel Consulta), 055 POS, 021/022 caja/categorías, 032 ticket  
**Cierre Fase 1:** 2026-10-04 — D1–D4 aprobados por Luis.  
**Cierre Fase 2:** 2026-10-04 — SC-008 script dry-run + util migración; apply prod solo Luis (no ejecutado por agente).

---

## Problema

El catálogo `Katzen/ServiciosClinica` (spec **056**) usa cuatro tipos: `consulta` | `diagnostico` | `domicilio` | `otro`. Eso mezcla dos ejes distintos:

1. **Qué se cobra** (acto clínico: consulta, estudio, procedimiento, honorarios).
2. **Dónde se presta** (en clínica vs a domicilio).

Hoy `domicilio` es un tipo excluyente: no se puede marcar «consulta a domicilio» ni «ultrasonido a domicilio». Además la lista es corta para una veterinaria general (faltan procedimientos/cirugía menor, etc.), y en cobro POS/caja `consulta` y `diagnostico` se colapsan a la misma categoría de línea (`consulta`), así que los reportes no aprovechan la distinción del catálogo.

---

## Decisiones D1–D4 (aprobadas Luis 2026-10-04)

Valores de la columna **Recomendado** = veredicto post-benchmark; **aprobados** para Fase 1.

| # | Pregunta | Recomendado | Justificación corta |
|---|----------|-------------|---------------------|
| D1 | ¿Mantener **Consulta** ≠ **Diagnóstico**? | **Sí** | Estándar AAHA/VMG y PMS (Vetspire, Provet, Cornerstone/AviMark): exam ≠ lab/imaging/diagnostics. El gap Katzen está en caja/KPIs, no en el catálogo. |
| D2 | ¿Domicilio = flag `esDomicilio` vs tipo? | **Sí → flag** (`esDomicilio?: boolean`) | Provet: home call es *tipo de consulta/encuentro*; ezyVet: travel fee en *appointment type*. No es un acto clínico excluyente. |
| D3 | ¿Tipos ola 1 = `consulta` / `diagnostico` / `procedimiento` / `otro`? | **Sí** | Compresión razonable para vet general MX; industria tiene más (lab vs imaging, dentistry…); ola 1 no necesita ese detalle. Deprecar `domicilio` como tipo. |
| D4 | ¿`procedimiento` → categoría caja `cirugia`? | **Sí (Fase 1)** | Pragmático: ya existe `cirugia` en caja/ticket. Nota: AAHA separa Surgery (5500) de Hospitalization & Treatment (5020); curaciones/sutura menor no son cirugía pura — opcional Fase 2+ si P&L lo pide. |

---

## Benchmark / decisión recomendada

Fuentes públicas (docs PMS + contabilidad clínica), 2026-10-04. DigiVet MX es **distribuidora**, no PMS; en LATAM los SaaS (Binpet, Sami, Zuvet) no publican taxonomía de cobro comparable — el benchmark fuerte es global + AAHA/VMG.

### Qué hacen otros

| Eje | Industria / PMS | Implicación Katzen |
|-----|-----------------|-------------------|
| **Consulta vs diagnóstico** | **AAHA/VMG COA:** Exam (5010) ≠ Diagnostic Services (5030) ≠ Laboratory (5300) ≠ Imaging (5400). **Vetspire:** flags `Is Exam` vs `In-House/Reference Diagnostic`; Orders: Diagnostics / Treatments / Medications. **Provet:** ítems procedure vs laboratory analysis/panel; reporting KPI separa Professional fees / Diagnostics / Surgery / Imaging. **Cornerstone / AviMark:** classes/revenue centers alineables a AAHA (Laboratory, Professional Services, Surgery). | Mantener `consulta` ≠ `diagnostico`. No fusionar. |
| **Domicilio** | **Provet Cloud API:** `consultation.type` incluye Outpatient / **Home call** / Farm visit — modalidad del *encuentro*, no categoría del producto. **ezyVet:** travel/house-call fee en settings del *appointment type* (fixed/variable km) + producto de fee; el servicio clínico sigue siendo otro product. Mobile clinic = mismo catálogo en otro lugar. | `domicilio` **no** debe ser `tipo`. Usar `esDomicilio` (o, más adelante, modalidad de visita). Fee de traslado = ítem aparte si algún día se cobra explícito (fuera de ola 1). |
| **Procedimientos / cirugía** | **Provet:** sub-recurso `procedures`. **Vetspire:** Treatments + tipos Surgical. **AAHA:** Surgery (5510) separado de Treatment (5020). | Introducir `procedimiento` en catálogo. Mapear a caja `cirugia` en Fase 1 (único bucket cercano); no inventar categoría caja nueva aún. |
| **Granularidad de tipos** | PMS maduros: muchos product groups / classes / revenue centers. Ola corta típica de clínica general: exam + diagnostics + procedures/surgery + misc. | Ola 1: 4 tipos. Lab vs ultrasonido pueden convivir bajo `diagnostico` hasta Fase 2+ P&L. |

### Veredicto D1–D4 (recomendado)

1. **D1 Sí** — Consulta ≠ Diagnóstico.
2. **D2 Sí flag** — `esDomicilio?: boolean` (ausente/`false` = clínica); deprecar `tipo: domicilio` en altas nuevas; legacy → flag + tipo efectivo sugerido `consulta`.
3. **D3 Sí** — `consulta` \| `diagnostico` \| `procedimiento` \| `otro`.
4. **D4 Sí Fase 1** — `procedimiento` → `cirugia` en mapeo línea/caja; documentar límite AAHA (tratamiento ≠ cirugía) para Fase 2 opcional.

La propuesta de taxonomía debajo **no cambia** respecto al borrador previo; el benchmark la **confirma**.

---

## Propuesta de taxonomía (sujeta a D1–D4)

| Código `tipo` | Label UI | Ejemplos | Línea visita → caja (propuesto) |
|---------------|----------|----------|----------------------------------|
| `consulta` | Consulta | General, seguimiento, urgencia (nombre del ítem) | `consulta` → `consulta` |
| `diagnostico` | Diagnóstico | Lab, ultrasonido, rayos, citología | **nuevo:** preferir distinguir en reportes; interim puede seguir `consulta` hasta Fase 2 |
| `procedimiento` | Procedimiento | Cirugía menor, sutura, limpiezas, curaciones | `cirugia` → `cirugia` |
| `otro` | Otro / honorarios | Honorarios, certificados, cargos varios | `otro` → `otro` |

**Fuera de este catálogo (sin cambio):** baño/peluquería (Finanzas 022), vacuna/medicamento (Inventario), pensión (Estancias / riel Pensión).

**Modalidad (aditivo):**

```text
Katzen/ServiciosClinica/{id}
  tipo: consulta | diagnostico | procedimiento | otro   # domicilio deja de usarse en altas nuevas
  esDomicilio?: boolean   # true = se presta / se cobra como visita a domicilio
  # legacy: tipo === 'domicilio' se lee como esDomicilio=true + tipo efectivo sugerido 'consulta' (o el que Luis elija)
```

---

## User stories

### US-1 — Tipos que reflejan el acto clínico

Como **administrador**  
Quiero **elegir un tipo de servicio (consulta, diagnóstico, procedimiento, otro) sin usar «Domicilio» como tipo**  
Para **clasificar bien tarifas y KPIs**

**Criterios de aceptación:**

- [x] SC-001: Dropdown Tipo sin opción «Domicilio»; incluye `procedimiento`.
- [x] SC-002: Checkbox «A domicilio» (`esDomicilio`) independiente del tipo.
- [x] SC-003: Lectura legacy: `tipo: 'domicilio'` se muestra como tipo efectivo + domicilio marcado (sin borrar nodo).

### US-2 — POS entiende modalidad sin riel nuevo

Como **recepcionista en caja**  
Quiero **ver servicios a domicilio en el mismo riel Consulta, con indicador claro**  
Para **cobrar sin inventar un cuarto riel**

**Criterios de aceptación:**

- [x] SC-004: Riel Consulta sigue listando todo el catálogo activo (056).
- [x] SC-005: Chip/icono o badge «Domicilio» si `esDomicilio` (o legacy `tipo === domicilio`).
- [x] SC-006: Línea de ticket conserva `servicioClinicaId`; mapeo categoría según tabla de taxonomía (Fase 1 mínima documentada).

### US-3 — Datos existentes sin ruptura

Como **dueño de producto**  
Quiero **migración suave aditiva**  
Para **no romper app móvil ni tickets ya cobrados**

**Criterios de aceptación:**

- [x] SC-007: Campos nuevos opcionales; no renombrar/borrar `tipo` en masa en la misma entrega UI.
- [x] SC-008: Script migración suave dry-run default + util `planPatchMigracionDomicilio`; lazy en edición (Fase 1); apply prod solo Luis (`plan.md`).
- [x] SC-009: KPIs admin dejan de contar «Domicilio» como tipo; cuentan flag (y legacy).

---

## Fuera de alcance

- Agenda / rutas de visitas a domicilio (ola 2 de 056)
- PAC / CFDI
- Migrar baño o inventario `categoria: diagnostico` a este nodo
- Riel POS nuevo «Domicilio»
- Categoría caja nueva `diagnostico` (opcional Fase 2+; requiere decisión P&L)
- Deploy sin autorización explícita de Luis

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** solo aditivo en `Katzen/ServiciosClinica/{id}` (`esDomicilio?`, nuevos valores de `tipo` en altas). Tickets históricos (`Visitas.lineas`) no se reescriben. App móvil no consume este nodo hoy (056).

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/ServiciosClinica/{id}` | staff | staff | `esDomicilio?`; `tipo` ampliado; legacy `domicilio` se sigue leyendo |
  | `Katzen/Visitas/{id}.lineas[]` | staff | staff | sin cambio obligatorio; snapshot económico intacto |

- **Estrategia de Datos de Prueba:** mocks en `mock-data.ts`; tests de `servicios-clinica.util` (normalizar tipo legacy + flag). Emulador/mocks — no prod.

- **Patrones UI Reutilizados:** diálogo 056 (`admin-dialog-shell`), KPI grid, riel Consulta en `visita-dialog`, copy «Borrar».

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador / doctor | sí (mismo módulo 056) |
| recepcionista | POS consume catálogo; CRUD según menú 072 |

---

## UI (rutas y layout)

- Misma ruta `/admin/servicios-clinica`
- Diálogo: Tipo + checkbox «A domicilio»
- KPIs propuestos: Activos · Consultas · Diagnóstico · Procedimientos · A domicilio (flag)
- POS: sin riel nuevo

---

## Backend

- [ ] Cloud Function: no (salvo script admin one-off Fase 2)
- [ ] Reglas RTDB: opcional índice `esDomicilio` si se filtra; deploy solo con Luis
- [ ] Email / integración: no

---

## Plan por fases (corto)

| Fase | Nivel | Entrega | Sin codear hasta OK Luis |
|------|-------|---------|---------------------------|
| **0** | Docs | Este `spec.md` + análisis; decidir D1–D4 | Hecho en borrador |
| **1** | L2 (+ L3 ligero si rules) | Modelo aditivo `esDomicilio`, UI Tipo sin Domicilio + `procedimiento`, lectura legacy, badge POS, tests util | Tras decisión |
| **2** | L3 | Migración suave nodos `tipo: domicilio` → `tipo` + `esDomicilio`; KPIs; alinear mapeo caja (diagnóstico sigue en `consulta` sin categoría nueva); opcional categoría diagnóstica en P&L = **aplazada** (Fuera de alcance) | Hecho código 2026-10-04; apply prod pendiente Luis |

### Mitigación / rollback

- Rollback UI: volver a 4 tipos en dropdown; ignorar `esDomicilio` en lectura.
- Datos: campo opcional se deja; no hay borrado destructivo.
- No mutar `Visitas` históricas.
- Fase 2 script: dry-run default; apply prod con `CONFIRM_PROD` + `MIGRATE_CONFIRM=LUIS`. Si se aplicó por error, nodos siguen legibles; se puede reponer `tipo: domicilio` manualmente (lectura legacy intacta) o dejar estado migrado. Detalle: `plan.md`.

---

## Testing mínimo

Ver `tasks.md` cuando pase a `in_progress`. Fase 1: unit tests util (legacy + flag + mapeo categoría) + `npm run build` + smoke 375/1280 diálogo y riel Consulta.

---

## Notas / decisiones

- Honorarios siguen en `otro` (056).
- Ultrasonido / lab = `diagnostico` (correcto; no fusionar con consulta).
- Spec **056** permanece dueña del CRUD/cobro; **093** es la evolución de taxonomía/modalidad.
- Benchmark industria 2026-10-04 (AAHA/VMG, Provet, ezyVet, Vetspire, Cornerstone/AviMark): confirma D1–D4 del borrador; ver sección «Benchmark / decisión recomendada».
- D1–D4 **aprobados Luis** 2026-10-04; Fase 1 implementada (código + tests + build).
- Al editar un legacy `tipo: domicilio`, el guardado escribe tipo clínico + `esDomicilio` (lazy por edición).
- Fase 2: script `scripts/migrate-servicios-clinica-domicilio.mjs` + util plan; **sin** categoría caja `diagnostico` (sigue bucket `consulta` en línea/caja). Apply prod no ejecutado por agente.

---

## Código tocado / utils reutilizados / no duplicar (078)

- **Reutilizar:** `servicios-clinica.models|util|service`, `visita-dialog` / `categoriaLineaDesdeServicioClinica`, `VISITA_LINEA_A_CAJA`, mocks 056/093.
- **Fase 2:** `planPatchMigracionDomicilio` / `contarKpisServiciosClinica` / script `migrate-servicios-clinica-domicilio.mjs`.
- **No inventar:** segundo catálogo, riel Domicilio, ni migrar baño aquí, ni categoría caja `diagnostico` sin OK Luis.
- **Memoria al cerrar:** [x] module-map [x] guardrails / domain-context [x] INDEX

---

## Follow-up verificación cobro POS (2026-10-04) — solo plan, sin codear

**Veredicto:** el cobro de `ServiciosClinica` en caja **ya está enlazado** (dueña: **056**). No hace falta spec **094** ni riel «Clínica».

| Pregunta | Respuesta |
|----------|-----------|
| ¿Aparecen en riel Consulta? | **Sí** — `serviciosParaRielConsulta` + cards en `visita-dialog` (`tapServicioClinica` → `servicioClinicaId`) |
| ¿Riel propio Clínica? | **No** — 093 SC-004/SC-005: mismo riel Consulta + badge Domicilio |
| ¿Vs peluquería / vacunas? | Baño = riel Peluquería (022/085). Vacuna stock + cola 086 = inventario/pendientes en Consulta. Catálogo clínica ≠ esos orígenes |
| Gap real vs «no lo veo» | Probable: riel exige dueño+mascota; o RTDB sin nodos / rules sin deploy (056: `catchError → []`); o falta CTA desde `/admin/servicios-clinica` hacia Nueva venta |

**Plan propuesto (no implementar hasta OK Luis):**

1. **Ops L3 (Luis):** confirmar `firebase deploy --only database` + nodos activos en `Katzen/ServiciosClinica` (emulador/localhost primero).
2. **Smoke L1/L2:** Nueva venta → dueño+mascota → chip Consulta → tap servicio con `precio_venta > 0` → línea en ticket.
3. **Opcional L1:** CTA mínimo en banner 056 («Probar en caja» → abrir POS / visitas). No nuevo cobro.
4. **No hacer:** segunda caja, riel Domicilio/Clínica, fusionar baño aquí, categoría caja `diagnostico` sin P&L, spec 094 duplicada.

Detalle anti-dup: `agent-guardrails` fila Servicios clínica / taxonomía.

# Tasks: Peluquería — flujo fácil + precios claros

**Spec:** `specs/085-peluqueria-flujo-facil/spec.md`  
**Nivel de cambio:** L2 (por fase)  

---

## Implementación

### Setup

- [x] Carpeta spec creada y alcance documentado (plan por fases A–D)
- [ ] Anti-duplicación: no segundo módulo peluquería; se mejora `/admin/banios` + defaults 022

### Fase A — Captura rápida

- [x] A.1 Modo Rápido / Completo en `banio-dialog`
- [x] A.2 Vista rápida: dueño/mascota, tipo (chips), tamaño, precio, nota, alergias alerta
- [x] A.3 Prefill fecha/hora ahora; estado programado / iniciar ya; duración 60; peluquero prefill staff
- [x] A.4 Defaults 022 al elegir tamaño (background)
- [x] A.5 «Más detalles» colapsado: pago/hora/peluquero/extras (sin costo/margen en UI; solo background)
- [x] A.6 Copy cobro en Ticket del día
- [x] Util + tests `banio-captura-rapida.util`
- [x] Build + unit tests Fase A

### Fase B — Hoy en peluquería + cola limpia (anti-basura)

- [x] B.1 Filtro Hoy (+ Mañana) default en `/admin/banios` (2026-10-18)
  - Util `banio-listado-filtro.util.ts`: sin búsqueda → secciones Hoy + Mañana (ISO local); al escribir → historial por cliente/paciente/tipo/fecha
  - Copy panel: «Hoy · N · Mañana · M»; empty por sección; búsqueda → «Resultados»
  - **CSV exporta lo visible** (hoy+mañana o resultados), no el histórico completo
- [ ] B.2 Acciones Iniciar / Terminé (= listo para cobrar)
- [x] B.3 CTA ticket + **Listo para cobrar** (`completado` → entra a cola)
- [x] B.3b Por-cobrar solo listos del día; al cobrar desaparecen (`banio-cola-mostrador.util`)
- [ ] B.3c En Peluquería: vista/filtro «Pendientes de cobro» (cualquier fecha)
- [ ] B.4 KPIs del día arriba; mensuales secundarios
- [ ] B.5 Mobile hit targets
- [x] Nota visible en cola
- [x] Build + tests cola

### Nota para mostrador (entrega 2026-10-01)

- [x] Label «Nota para mostrador» en diálogo baño (`observaciones`)
- [x] Badge + Ver nota en POS pendientes y en Cobrar «Por cobrar hoy»
- [x] Aviso al incluir baño con nota (ofrecer medicamento)
- [x] Spec 085 modelo + ciclo de vida anti-basura + domain-context

### Prefill desde «Llegó un paciente» (2026-10-01)

- [x] Baño/pensión: si ya hay `paciente_id`, **no** volver a pedir dueño/mascota — resumen compacto (paridad vacuna/historial, SC-002 de 070)
- [x] Util `alta-rapida-prefill.util` + picker con `[formGroup]` + restore de IDs más robusto
- [x] Unit tests + build
- [x] Hotfix loading trabado al guardar baño desde alta rápida (`show` sin `hide` → overlay eterno); `finally` + red de seguridad en `abrirAtencionAltaRapida`

### Picker Nuevo baño (2026-10-18) — sin alta + búsqueda dual

- [x] `banio-dialog`: `[permitirCrear]=false` — sin «Cliente nuevo» / «Agregar mascota»; copy hint dual
- [x] `[busquedaDual]=true` — buscar mascota sin dueño previo; al elegir rellena dueño
- [x] Layout picker: CTAs crear debajo del campo (no solapan `mat-hint` en móvil)
- [x] Utils `filtrarPacientesPickerDual` + `getPacientePickerOptionLabel` en `paciente-search.util`
- [x] Unit tests + build (registro abajo)

### Fix cola POS: baño cobrado no desaparecía (2026-10-01)

- [x] Causa: línea «Nuevo baño» sin `banioId` → no se escribe `visitaId` en `Katzen/Banios`
- [x] `vincularBaniosHuerfanosEnLineas` + persistir siempre llama `vincularOrigenesDesdeLineas`
- [x] Si hay notas pendientes, «Nuevo baño» pide tocar la nota (o usa la única)
- [x] Pendientes POS solo `completado` con precio &gt; 0 (alineado cola 085)
- [x] Unit tests + build

### Fase C — Precios claros

- [ ] C.1 Entrada obvia a tarifas por tamaño (022)
- [ ] C.2 Chips P/M/G → precio
- [ ] C.3 Hint precio ajustado manual
- [x] C.4 Costo **sin UI** en diálogo (Rápido y Completo): solo «Precio a cobrar»; `costoEstimado` background desde tarifas
- [ ] C.5 (Opcional) tamaño recordado — solo si Luis lo pide
- [ ] Build + smoke tarifas

### Fase D — Pulido

- [ ] D.1 Última observación + alergias
- [ ] D.2 Chips de nota rápida
- [ ] D.3 Loading / errores humanos
- [ ] D.4 QA L2 registrado; INDEX/estado `done` si aplica

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Diálogo | `src/app/banios/banio-dialog.component.*` |
| Listado | `src/app/banios/banios.component.*` |
| Defaults | `finanzas/defaults-banio.service` (022) — reutilizar |
| Ticket | flujo existente «Agregar al ticket» — no segundo cobro |
| Cola mostrador | `visitas/banio-cola-mostrador.util.ts` (+ spec) — no duplicar filtros en componentes |
| Pendientes POS + huérfanos | `visitas/pendientes-visita.util.ts` — `vincularBaniosHuerfanosEnLineas`; persistir siempre `vincularOrigenesDesdeLineas` |
| Captura rápida | `banios/banio-captura-rapida.util.ts` (+ spec) |
| Listado Hoy+Mañana / búsqueda | `banios/banio-listado-filtro.util.ts` (+ spec) — default hoy+mañana; CSV = filas visibles; núcleo genérico `core/utils/listado-hoy-manana.util.ts` (extensión a citas/pensión/recordatorios/vacunas/consentimientos/historiales 2026-10-18) |
| Fechas local MX | `shared/datepicker/datepicker.util` — `formatearFechaLocalEs` + `formatLocalDateTimeStamp` (no `toISOString` ni `new Date(iso-fecha)`) |
| Prefill Llegó un paciente | `alta-rapida/alta-rapida-prefill.util.ts` — oculta picker si ya hay mascota; `labelDueñoDesdeDialogData` (string\|Cliente) |
| Picker dual baño | `shared/admin/cliente-paciente-picker` (`busquedaDual`, `permitirCrear=false` en baño) + `paciente-search.util` (`filtrarPacientesPickerDual`) |
| Fix hint overlap 375 | `subscriptSizing=dynamic` + hints cortos + margen picker→sección tipo servicio (`cliente-paciente-picker` + `banio-dialog` SCSS) |

```
QA agente 2026-10-18 (L2 UI hint Mascota vs TIPO DE SERVICIO):
- Causa: subscript fijo + hint largo → overflow sobre título sección
- Fix: dynamic + copy corto + margin-bottom picker (24px ≤640)
- Smoke 375: gap hint→título ≈43px, overlap=false; build exit 0
- Sin commit/deploy
```
| Recordatorio desde expediente | `pacientes.agregarRecordatorio` pasa paciente objeto + cliente/cliente_id; `recordatorio-dialog` entity-summary usa labelDueño |

```
QA agente 2026-10-04 (L2 bug dueño vacío en Nuevo recordatorio):
- Causa: `cliente` string + getNombreCompletoCliente(objeto) → ""
- Fix: labelDueñoDesdeDialogData + prefill form + paciente objeto desde expediente
- Tests alta-rapida-prefill: 2/2 SUCCESS
- npm run build: exit 0
- commit/push/deploy: solo con autorización de Luis
```
| No duplicar | No crear `/admin/peluqueria` paralelo |

---

## Validación (agente revisó — L2)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| Unit tests captura rápida | **3/3 OK** | `banio-captura-rapida.util.spec` |
| Unit tests listado Hoy+Mañana/búsqueda | **8/8 OK** | `banio-listado-filtro.util.spec` (B.1 2026-10-18) |
| Unit tests util genérico listado | **8/8 OK** | `core/utils/listado-hoy-manana.util.spec` (extensión listas 2026-10-18) |
| Unit tests datepicker fechas local | **6/6 OK** | `datepicker.util.spec` (timezone baño 2026-10-18) |
| Unit tests picker dual / paciente-search | **5/5 OK** | `paciente-search.util.spec` (dual 085 2026-10-18) |
| Unit tests cola + por-cobrar + pendientes | **OK** 2026-10-01 | + `vincularBaniosHuerfanosEnLineas` |
| `npm run build` (exit 0) | **0** | 2026-10-18 solo «Precio a cobrar» (sin UI costo) |
| Reglas cola (revisión código) | OK | programado≠cola; completado+precio=entra; visitaId/pagado/caja/otra fecha=sale |
| Smoke UI :4200 1280 | **OK** (cola) + serve vivo Fase A | Banios diálogo: toggle Rápido/Completo |
| RTDB aditiva | N/A | usa campos existentes |
| Cypress | N/A | sin ruta nueva |

```
QA agente 2026-10-01:
- Fase A captura rápida: modo Rápido default, chips tipo/tamaño, más detalles colapsado, prefill ahora
- Cola limpia B.3b + Listo para cobrar
- Prefill «Llegó un paciente» → baño/pensión con resumen (sin picker vacío)
- Fix POS: baño cobrado sale de pendientes (banioId + visitaId); no «Nuevo baño» si hay notas
- Tests captura 3/3 · pendientes/persistir OK · build exit 0
- Fases C/D y B.1/B.3c pendientes
- commit/push/deploy: solo con autorización de Luis
```

```
QA agente 2026-10-18 (L2 B.1 listado Hoy):
- Default: solo baños con fecha_banio ISO local = hoy; meta «Hoy · N baños»
- Buscador abre historial (cliente/paciente/tipo/fecha); CSV = filas visibles
- Util + tests banio-listado-filtro 5/5 · npm run build exit 0
- commit/push/deploy: solo con autorización de Luis
```

```
QA agente 2026-10-18 (L2 B.1 Hoy + Mañana):
- Sin búsqueda: dos secciones «Hoy» / «Mañana» (contadores + empty por sección); ISO local
- Con búsqueda: sección «Resultados» (historial filtrado); CSV = hoy+mañana o resultados
- Util + tests banio-listado-filtro 8/8 · npm run build exit 0
- commit/push/deploy: solo con autorización de Luis
```

```
QA agente 2026-10-18 (L2 fix timezone fechas baño):
- Causa: listado hacía `new Date('yyyy-MM-dd')` (UTC → −1 día MX); created_at con toISOString() (UTC → +1 día de noche)
- Fix: `formatearFechaLocalEs` + `formatLocalDateTimeStamp` en datepicker.util (090); banios service/listado/detalle/dialog
- Storage fecha_banio intacto (ISO local); created_at/updated_at ahora naive local
- Tests datepicker.util + build (ver registro abajo)
- commit/push/deploy: solo con autorización de Luis
```

```
QA agente 2026-10-18 (L2 picker Nuevo baño dual + sin alta):
- permitirCrear=false en banio-dialog; busquedaDual=true
- Utils filtrarPacientesPickerDual + getPacientePickerOptionLabel
- Layout CTAs crear debajo del campo (móvil sin solape hint)
- Tests paciente-search.util (dual) · npm run build exit 0
- commit/push/deploy: solo con autorización de Luis
```

```
QA agente 2026-10-18 (L2 UX precio Rápido — un solo monto):
- Rápido: solo «Precio» / Precio al cliente (cobro mostrador); sin Costo/Margen ni en Más detalles
- Completo: Precio al cliente visible; Costo/margen bajo «Opciones de costo» colapsado
- Tarifas tamaño siguen prefilling precio_total + costoEstimado (background)
- Hint + subscriptSizing=dynamic; copy «Lo que se cobra en mostrador / Ticket del día»
- npm run build: exit 0 · sin commit/deploy
```

```
QA agente 2026-10-18 (L2 solo precio — sin opciones de costo):
- banio-dialog: quitada sección «Opciones de costo» (Rápido y Completo)
- Único campo dinero: «Precio a cobrar» (precio_total); copy claro
- costoEstimado sigue en background desde tarifas defaults; no se exige al staff
- Si costo ≥ precio o vacío → se omite al guardar (no bloquea alta)
- KPIs margen: usan costo estimado auto; sin costo = N/A parcial (hint en listado)
- npm run build: exit 0 · sin commit/deploy
```



---

## Memoria actualizada

- [x] `PLAN-UX-VETERINARIAS.md` enlace a 085
- [x] `module-map.md` nota banios + 085
- [x] `agent-guardrails.md` fila anti-dup 085
- [x] `node scripts/specs-index.mjs`

### Decisión negocio 2026-10-04 (Luis) — baño ≠ Petshop

- Confirmado: **no** alta de servicios de baño como producto inventario Petshop para descontar stock («dar de baja»).
- Canónico: módulo Banios + defaults/tarifas **022**; cobro en riel POS Peluquería (cola / Nuevo baño).
- Código ya alineado: `productoDescuentaInventarioPos` no baja anaquel en `BACO*` ni tarifas baño/corte; riel Petshop lista insumos `categoria: peluqueria` (shampoo), no el servicio.
- Residual: si import PDV dejó SKUs `BACO*` en Inventario, pueden aparecer en Petshop (riel real ignora `rielPos`); **no** borrar prod. Follow-up L1 opcional: filtrar/ocultar esos SKU del riel Petshop.
- Documentado en `agent-guardrails` + `domain-context` §4.9.

### Follow-up 2026-10-18 — costos internos + tamaño XL

- Luis: ¿para qué costos internos? → KPIs (margen bruto); no se cobran en POS; cobro = precio al cliente (`precio_total`).
- Follow-up UX: «¿solo preocuparse por el precio?» → **sin UI** costo/margen en diálogo (ni Completo). Costo auto desde tarifas; KPIs con estimado o N/A. Tarifas = Finanzas **022**.
- Tamaño **XL** en Rápido (chips) y Completo (select) + defaults Finanzas **022** + fallback código. Ver nota en tasks **022**.

### Follow-up 2026-10-18 — Nueva cita mismo picker que baño (L2)

- `cita-dialog`: `permitirCrear=false` + `busquedaDual=true`; sin alta rápida; copy dual dueño/mascota.
- Código: `src/app/citas/cita-dialog.component.{ts,html}` + módulo sin diálogos alta.
- `npm run build`: exit 0 · sin commit/deploy.

### Follow-up 2026-10-18 — Mascota → rellena dueño (writeValue)

- Bug: `clienteSearch.setValue(label string)` + `displayWith` esperaba `Cliente` → input dueño vacío al elegir mascota (citas/baños, `busquedaDual`).
- Fix: writeValue con objeto Cliente/Paciente; `displayClienteAutocompleteValue` / `displayPacienteAutocompleteValue`; patch `cliente_id` + nombre.
- Código: `cliente-paciente-picker.component` + utils display; tests en `cliente-search` / `paciente-search`.
- Smoke: elegir mascota → dueño visible + form válido.

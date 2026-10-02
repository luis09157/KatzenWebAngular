# Spec: Peluquería — flujo fácil + precios claros

**ID:** 085-peluqueria-flujo-facil  
**Estado:** in_progress  
**Fecha:** 2026-10-01  
**Autor:** Agente (Luis)  
**Nivel:** L2 (UI/lógica Angular; RTDB solo aditivo si hace falta)  

---

## Problema

Quien baña o recibe en peluquería necesita **registrar el servicio en segundos**, no llenar un formulario de finanzas. Hoy el diálogo «Nuevo baño» mezcla:

1. Operación (dueño, mascota, tipo, observaciones, alergias)  
2. Programación (fecha, hora, duración, prioridad, estado)  
3. Costos (costo, margen %, precio)  
4. Pago (método, «¿ya pagado?»)  

Eso choca con la regla de dominio ya acordada: **baño ≠ cobro**; el cobro va en **Ticket del día / caja**. Los defaults por tamaño (**022**) ya existen, pero quedan enterrados detrás de demasiados campos.

**Objetivo:** que registrar un baño sea fácil para el peluquero/recepción, y que costos/márgenes sigan existiendo para admin — sin romper lo que hoy funciona (listado, KPIs, CSV, ticket, portal baños, `Katzen/Banios`).

---

## Principios (no negociables en esta oleada)

1. **Lo de hoy sigue funcionando:** mismos nodos `Katzen/Banios`, mismos estados, mismo vínculo a ticket/caja, mismos KPIs.  
2. **Mínimo obligatorio en captura diaria:** dueño + mascota + tipo de servicio + precio al cliente (con default).  
3. **Lo automático no se pregunta:** fecha/hora = ahora; peluquero = usuario logueado; tamaño → precio/costo desde defaults 022.  
4. **Dinero en el momento correcto:** cobro en Ticket del día; costo/margen fuera del camino diario (admin / «Más detalles»).  
5. **RTDB aditivo:** no renombrar ni borrar campos; campos nuevos opcionales.  
6. **UI admin:** patrones de `docs/ADMIN-UI-ARCHITECTURE.md`.

---

## Plan de trabajo en fases

Esfuerzo: **S** ≈ ½–1 día · **M** ≈ 1–2 días (con agente).  
Cada fase es entregable por separado (build + smoke); se puede desplegar cuando Luis autorice.

### Fase A — Captura rápida (lo más urgente) · Esf. M · L2

**Para quién:** peluquero / recepción en el momento del baño.

| # | Qué | Resultado |
|---|-----|-----------|
| A.1 | Diálogo en **dos modos**: «Rápido» (default) y «Completo» | El 90 % de baños se registra en &lt; 30 s |
| A.2 | Modo rápido muestra solo: dueño/mascota, tipo de servicio (chips o select corto), tamaño (si aplica), precio (prefill), observación corta, alergias alerta | Sin costo, margen, método de pago ni «¿pagado?» en la vista principal |
| A.3 | Prefill: fecha/hora = ahora; estado = `programado` (o `en_proceso` si se elige «Iniciar ya»); peluquero = usuario actual (ya hay prefill); duración default 60 | Menos campos tocados |
| A.4 | Defaults 022: al elegir tamaño → costo + precio sugeridos en background (siguen guardándose) | Precios siguen alimentando KPIs |
| A.5 | «Más detalles» colapsado: prioridad, comportamiento, duración, servicios adicionales, costo/margen, pago legacy | Admin/contabilidad no pierde campos |
| A.6 | Copy claro: «Registra el baño. El cobro se hace en Ticket del día.» | Alineado a dominio |

**Criterios:**

- [x] SC-001: Crear baño nuevo en modo rápido exige solo cliente, paciente, tipo_servicio y precio_total &gt; 0 (resto con defaults válidos).  
- [x] SC-002: Campos costo / margen / pagado / método_pago no aparecen en la vista rápida (sí en «Más detalles» o solo al editar completo).  
- [x] SC-003: Al guardar, el registro sigue siendo un `Banio` válido: listado, detalle, CSV y KPIs lo leen igual.  
- [x] SC-004: Editar un baño existente abre en modo completo, sin pérdida.

---

### Fase B — «Hoy en peluquería» (flujo del día) · Esf. M · L2

**Para quién:** quien está en el área de baños todo el día.

| # | Qué | Resultado |
|---|-----|-----------|
| B.1 | Filtro / pestaña **Hoy** en `/admin/banios` (default al abrir) | No hay que buscar en el histórico |
| B.2 | Estados con acciones grandes: **Iniciar** → `en_proceso`; **Terminé** → `completado` | Menos editar formulario |
| B.3 | Tras «Terminé»: CTA visible **Agregar al ticket / Enviar a cobrar** (no solo menú ⋮); monto = `precio_total` | Recepción ve el cobro en Cobrar |
| B.3b | Lista o badge «Pendientes de cobro» + deep-link a Ticket del día del cliente | Handoff explícito peluquería → Cobrar |
| B.4 | KPIs mensuales debajo o colapsados; arriba: conteo Hoy (programados / en proceso / listos / cobrados) | Pantalla de trabajo, no de reportes |
| B.5 | Mobile: botones ≥44px; menos columnas en tabla / cards del día | Tablet en el área de baños |

**Criterios:**

- [ ] SC-005: Al entrar a peluquería, filtro Hoy activo por defecto (se puede cambiar a «Todos»).  
- [ ] SC-006: Desde la fila/card de un baño de hoy se puede pasar a `en_proceso` y a `completado` sin abrir el diálogo completo.  
- [ ] SC-007: Baño `completado` (o listo para cobrar) sin ticket muestra CTA «Agregar al ticket / Enviar a cobrar» visible (no solo ⋮); la línea usa `precio_total`.  
- [ ] SC-008: Listado histórico / export CSV / KPIs de período siguen disponibles.  
- [ ] SC-015…SC-018: ver sección **Análisis Peluquería ↔ Cobrar**.

---

### Fase C — Precios y costos entendibles · Esf. S–M · L2

**Para quién:** admin / dueño de clínica (configuración) + quien registra (confirmación de precio).

| # | Qué | Resultado |
|---|-----|-----------|
| C.1 | Pantalla o sección clara **«Precios de baño por tamaño»** (ya existen defaults 022): pequeño / mediano / grande → costo + precio sugerido | Configurar una vez |
| C.2 | En captura rápida: chips de tamaño P/M/G que actualizan el precio al instante con hint «Según tarifa de la clínica» | Sin margen % en el día a día |
| C.3 | Si el precio se edita a mano, hint «Precio ajustado para este baño» | Transparencia |
| C.4 | Costo estimado se rellena solo desde default; visible solo en «Más detalles» / finanzas | Peluquero no pelea con margen |
| C.5 | (Opcional aditivo) recordar último tamaño usado por mascota en el baño o campo opcional en mascota — **solo si no complica** | Menos clics la 2.ª visita |

**Criterios:**

- [ ] SC-009: Cambiar tamaño en captura actualiza precio_total y costoEstimado desde defaults sin abrir Finanzas.  
- [ ] SC-010: Admin puede editar defaults 022 desde un enlace/entrada obvia desde peluquería («Editar tarifas»).  
- [ ] SC-011: Baños legacy con costo = venta siguen leyéndose (margen 0); no se migran.

---

### Fase D — Pulido y seguridad operativa · Esf. S · L2

| # | Qué | Resultado |
|---|-----|-----------|
| D.1 | Al abrir baño: bloque compacto de **última observación** + alergias (ya hay alerta) | Contexto clínico de aseo |
| D.2 | Chips de nota rápida (nervioso, piel sensible, no aire caliente, etc.) que rellenan observaciones | Menos tecleo |
| D.3 | Loading contextual + mensajes de error humanos (LoadingService / ErrorMessages) | No “spinner eterno” |
| D.4 | Smoke documentado 375 / 1280; nota en `tasks.md` | Cierre SDD |

**Criterios:**

- [ ] SC-012: Alergias visibles antes de guardar.  
- [ ] SC-013: Al menos 3 chips de observación opcionales.  
- [ ] SC-014: `npm run build` exit 0; registro QA L2 en `tasks.md`.

---

## Orden recomendado

```
A (captura rápida) → B (Hoy + cola limpia anti-basura) → C (tarifas) → D (pulido)
```

Cola de mostrador y historial se definen en § **Ciclo de vida**. No saltar a C/D sin A/B básicos.

---

## Modelo acordado (Luis, 2026-10-01) — peluquera → mostrador

1. **La peluquera fija el precio** de cada baño (siempre puede variar). Ese valor es `precio_total`.  
2. Cuando el baño está **listo para cobrar**, aparece en **Mostrador / Cobrar → «Por cobrar hoy»** con ese monto exacto.  
3. La peluquera puede dejar una **nota para mostrador** (herida, piel, picazón, etc.) en `observaciones`.  
4. En mostrador esa nota debe **verse** (o abrirse con un botón) para saber **qué ofrecer** (medicamento / producto) en el mismo ticket.  
5. El **costo interno** (`costoEstimado`) no es lo que se cobra.  
6. **Cola ≠ historial** (ver § Ciclo de vida abajo): al cobrar, el baño **desaparece del mostrador**; el registro sigue existiendo en Peluquería / ticket / reportes.

### Criterios handoff (refuerzo)

- [ ] SC-015: Solo baños **listos para cobrar** del día (con `precio_total` &gt; 0, no cancelados, sin ticket/pago) aparecen en «Por cobrar hoy».  
- [ ] SC-016: Al agregar/seleccionar ese baño en el ticket, el monto de la línea = `precio_total` designado (sin pedir otro precio si ya hay monto).  
- [ ] SC-017: Si hay `observaciones`, mostrador ve badge «Nota» + botón «Ver nota».  
- [ ] SC-018: Tras incluir baño con nota, se avisa que puede agregar medicamento/producto.  
- [ ] SC-019: No reabrir cobro directo en caja si ya hay `visitaId` (039).  
- [ ] SC-020: Tras cobrar (o vincular `visitaId` / `pagado` / caja), el ítem **deja de listarse** en «Por cobrar hoy».  
- [ ] SC-021: Baños de **otros días** no aparecen en la cola de hoy (aunque sigan sin cobrar: se ven en Peluquería con filtro, no en mostrador).  
- [ ] SC-022: «Programado» sin marcar listo **no** ensucia mostrador (evita basura de citas a futuro / pruebas).

---

## Ciclo de vida: cola de mostrador vs historial (anti-basura)

**Problema:** si todo baño guardado (incl. pruebas, programados, días viejos) sale en Cobrar, el mostrador se llena de “basura” y recepción no sabe qué cobrar hoy.

### Tres lugares distintos

| Lugar | Qué muestra | Qué no es |
|-------|-------------|-----------|
| **Cobrar → Por cobrar hoy** | Cola **corta del día**: solo listos para cobrar y aún no cobrados | No es historial ni archivo |
| **Peluquería (`/admin/banios`)** | Historial operativo: Hoy / período / todos; KPIs; CSV | Aquí sí viven los registros viejos |
| **Ticket / caja / finanzas** | Prueba de cobro y dinero | No se borra al “limpiar” la cola |

### Cómo entra y sale de la cola (regla de oro)

```
Peluquera guarda baño (puede quedar programado / en proceso)
        │
        ▼
  [Listo para cobrar]  ← botón explícito o al marcar «Terminé»
        │
        ▼
  Aparece en Mostrador «Por cobrar hoy»  (precio + nota)
        │
        ▼
  Mostrador Agregar → ticket → Cobrar
        │
        ▼
  Desaparece de la cola  (tiene visitaId / pagado / caja)
        │
        ▼
  Sigue en historial Peluquería + en el ticket (no es basura: es archivo útil)
```

**Desaparece del mostrador cuando** (cualquiera):

- se agregó al ticket (`visitaId`), o  
- `pagado: true`, o  
- tiene `cajaMovimientoId`, o  
- `estado: cancelado`, o  
- `activo: false` (baja lógica «Borrar» en UI).

**No entra / no se queda en mostrador:**

- baños **sin precio** (`precio_total` ≤ 0),  
- baños **de otra fecha** (aunque estén impagos → se gestionan en Peluquería: filtro «Pendientes» / atrasados),  
- baños solo **programados** sin «Listo para cobrar» (evita cola llena de agenda),  
- pruebas / basura: marcar **Borrar** (baja lógica) o **Cancelar**; no hace falta borrar nodos RTDB.

### Basura que ya existe hoy

| Tipo | Qué hacer (plan) |
|------|------------------|
| Pruebas / baños basura | En Peluquería: Borrar (activo false) o Cancelar. No aparecen en cola si cancelados / sin precio / otra fecha |
| Impagos de días anteriores | **No** en «Por cobrar hoy». Fase B: filtro en Peluquería «Pendientes de cobro» (cualquier fecha) para cleanup consciente |
| Duplicados ya cobrados | Ya salen de cola por `visitaId`/`pagado`; si aún se ven, es bug de filtro |

**No** hacemos purge masivo en producción sin autorización de Luis. La higiene es **filtros de cola + baja lógica**, no borrar historial financiero.

### Campo / señal «Listo para cobrar» (implementación)

Preferencia (aditivo, compatible móvil):

- Opción A (simple): usar `estado: completado` (+ precio) como “listo” — botón **Terminé / Listo para cobrar**.  
- Opción B (más clara): campo opcional `listoMostrador: true` al pulsar el CTA (RTDB aditivo).  

Decisión de implementación en Fase B: **A primero**; B solo si hace falta distinguir “terminó el baño” de “aún no quiero cobrar”.

### Ajuste al plan de fases

| Fase | Qué suma anti-basura |
|------|----------------------|
| **B** | Cola solo listos del día; al cobrar desaparecen; filtro Hoy en peluquería; lista «Pendientes atrasados» fuera de mostrador |
| **A** | Al guardar no empujar a mostrador automáticamente si es solo agenda |
| **D** | Copy: «Esto no es historial; al cobrar sale de la cola» |

---

## Análisis: Peluquería ↔ pestaña Cobrar (handoff)

**Pregunta de Luis (2026-10-01):** si estamos en peluquería y hay un costo/precio, ¿cómo lo sabe recepción para cobrarlo en Cobrar?

### Dos números distintos (no confundir)

| Campo en `Katzen/Banios` | Quién lo usa | ¿Lo necesita recepción para cobrar? |
|--------------------------|--------------|-------------------------------------|
| **`precio_total`** | Lo que paga el **dueño** | **Sí** — es el monto del ticket |
| **`costoEstimado`** | Costo interno / margen / KPIs (022) | **No** — no va a la línea de cobro |

Recepción cobra **`precio_total`**, no el costo. El costo solo alimenta ganancia en finanzas (`precio_total − costoEstimado`).

### Cómo se relacionan hoy los módulos (ya implementado)

```
Peluquería (/admin/banios)          Cobrar (/admin/visitas = Ticket del día)
─────────────────────────          ───────────────────────────────────────
1. Alta baño con precio_total  →   (aún no hay cobro)
2a. Swal post-alta «¿Agregar     →  VisitaLinea { monto: precio_total,
    a la cuenta del día?»           banioId, descripcion }
    O menú ⋮ «Agregar al ticket»
2b. O recepción abre ticket del  →  Card «pendientes de baño» del cliente
    cliente en Cobrar / Hoy         del día (filtrarBaniosPendientesTicket)
3. Recepción cobra el ticket    →  Caja + Banio.pagado / visitaId
```

Código de verdad:

- `BaniosService` / diálogo → guarda `precio_total` (+ `costoEstimado` opcional).  
- `banios.component` → `agregarServicioAVisita({ monto: precio_total, banioId })`.  
- `pendientes-visita.util.ts` → lista pendientes con `precio_total` para el POS.  
- `por-cobrar-hoy.util.ts` → “Por cobrar hoy” incluye baños pendientes con ese monto.  
- Specs previas: **032, 039, 040, 045, 050** (un solo camino de cobro = ticket).

### El problema real (no es que “falte el monto”)

El monto **sí viaja** al ticket cuando alguien hace el puente. Lo que falla en la clínica es el **handoff humano**:

1. **Paso oculto:** «Agregar al ticket» vive en el menú ⋮ (y a veces solo si está `completado` / no pagado). Quien baña o recepción no lo ve.  
2. **Dos pantallas, dos roles:** peluquería registra; Cobrar cobra. Si nadie pulsa «Agregar…» ni abre el ticket del cliente **hoy**, recepción en Cobrar ve un ticket vacío o solo petshop — **no adivina el precio**.  
3. **Confusión costo vs precio:** el formulario muestra “Costo” y “Margen %” junto al precio; recepción puede creer que debe cobrar el costo.  
4. **Baño libre en riel Peluquería del POS:** se puede agregar una línea “baño” con tarifa default **sin** ligar al registro de `/admin/banios` → riesgo de doble línea o precio distinto al del módulo.  
5. **Post-alta opcional:** el Swal «¿Agregar a la cuenta?» se puede cancelar («Ahora no») y luego olvidarse.

### Respuesta operativa (cómo debería pensarlo el staff)

| Quién | Qué hace | Qué ve el otro |
|-------|----------|----------------|
| Peluquería | Registra baño con **precio al cliente** (no “costo”) | Queda pendiente de cobro |
| Peluquería o recepción | **Agregar al ticket del día** (o aceptar el Swal al crear) | En Cobrar, la línea ya trae el monto |
| Recepción en Cobrar | Abre ticket del dueño → ve pendientes / línea → cobra | Paga `precio_total`; el costo no aparece |

Si recepción entra a Cobrar **sin** ese puente: debe elegir el **mismo cliente** del baño; el POS muestra baños pendientes **del mismo día** con su `precio_total` para «Incluir».

### Qué debe mejorar 085 (sin romper 045/050)

| Hueco | Fase | Acción |
|-------|------|--------|
| Handoff invisible | **B** | CTA «Listo para cobrar / Enviar a mostrador» + nota |  
| Recepción no sabe monto | **B** | Cola «Por cobrar hoy» con `precio_total`; al cobrar **sale** de la cola |  
| Basura / historial en mostrador | **B** | Solo listos del **día**; programados e impagos viejos fuera de cola; historial en Peluquería |  
| Confundir costo con precio | **A + C** | Captura rápida solo «Precio al cliente» |  
| Documentar modelo mental | esta sección + domain-context | Cola corta ≠ archivo |

### Criterios extra (handoff)

- [ ] SC-015: Tras crear/completar un baño no vinculado, hay CTA visible (no solo ⋮) «Agregar al ticket / Enviar a cobrar» que crea línea con `monto = precio_total` y `banioId`.  
- [ ] SC-016: En Cobrar, con el dueño del baño seleccionado y fecha de hoy, el pendiente muestra el **mismo** `precio_total` del baño (no el costo).  
- [ ] SC-017: Copy en peluquería: «Precio al cliente (lo que se cobra en Ticket del día). El costo interno no lo ve recepción al cobrar.»  
- [ ] SC-018: No reabrir cobro directo en caja desde baño si ya hay `visitaId` (ya 039; no regresar).

---

## User stories (resumen)

### US-1 — Registrar baño en segundos

Como **peluquero o recepción**  
Quiero registrar dueño, mascota, tipo y precio sugerido  
Para no retrasar la fila de baños.

### US-2 — Seguir el día sin pelear con la tabla

Como **quien atiende peluquería**  
Quiero ver solo los baños de hoy e Iniciar / Terminé / Cobrar  
Para trabajar con las manos ocupadas.

### US-3 — Tarifas claras para la clínica

Como **administrador**  
Quiero definir costo y precio por tamaño una vez  
Para que cada baño salga con precio sensato y el margen se calcule solo.

### US-4 — Recepción sabe qué cobrar

Como **recepcionista en Cobrar**  
Quiero ver el baño pendiente con el **precio al cliente** (o abrirlo desde peluquería con un toque)  
Para no preguntar «¿cuánto fue el baño?» ni cobrar el costo interno.

---

## Fuera de alcance

- Nuevo módulo paralelo de “Peluquería 2” (se mejora `/admin/banios`).  
- Cobrar dentro del diálogo de baño (rompe baño ≠ cobro).  
- CFDI / facturación electrónica.  
- App móvil nativa (solo no romper contrato RTDB).  
- Migración masiva de baños legacy.  
- Inventario de productos de peluquería (`ProductosPeluqueria`) como POS completo (sigue aparte; se puede enlazar después).

---

## Contratos de Datos y UI

- **Impacto RTDB:** principalmente lectura/escritura existente de `Katzen/Banios/{id}` y `Katzen/Finanzas/DefaultsBanioPorTamano`. Campos nuevos **opcionales** solo si Fase C/D lo requieren (ej. `ultimaNotaBanio` denorm — decidir en la fase; default: no hace falta).  
- **App móvil:** no renombrar `tipo_servicio`, `estado`, `precio_total`, `pagado`, etc.  
- **Pruebas:** localhost / emuladores / mocks — no prod.  
- **UI:** `admin-dialog-shell`, `app-cliente-paciente-picker`, `app-staff-picker`, `admin-empty-state`, banner + data-panel, Ticket del día existente.

| Nodo | Lectura | Escritura | Notas |
|------|---------|-----------|-------|
| `Katzen/Banios/{id}` | staff | staff | contrato actual; UI cambia, no el shape obligatorio |
| `Katzen/Finanzas/DefaultsBanioPorTamano` | staff | staff (config) | 022 ya existe |
| `Katzen/Mascota/{id}` | staff | alergias sync 034 | solo aditivo si se guarda tamaño opcional |

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí |
| doctor | sí (menú actual) |
| recepcionista | sí |
| peluquero | sí (usuario principal de A/B) |

---

## UI (rutas)

- Ruta: `/admin/banios` (sin ruta nueva).  
- Diálogo: `banio-dialog` (modo rápido / completo).  
- Cobro: flujo actual Ticket del día (CTA más visible en B).

---

## Backend

- [ ] Cloud Function nueva: **no**  
- [ ] Reglas RTDB: solo si aparece campo nuevo (aditivo)  
- [ ] Email: no  

---

## Rollback

- Revertir commit(s) de la fase + `firebase deploy --only hosting` autorizado.  
- Datos de baños previos intactos.  
- Si un campo opcional nuevo molesta: dejar de escribirlo; lectores ignoran `undefined`.

---

## Relación con otras specs

| Spec | Relación |
|------|----------|
| 018 / 021 / 022 | Link baño→caja, costos, defaults por tamaño — **se reutilizan** |
| 028 | Portal baños read-only — no romper |
| 034 / 035 | Alergias + staff UID — mantener |
| 045 / Ticket del día | Cobro — potenciar CTA / handoff; no duplicar cobro |
| 039 / 050 | Un solo camino de cobro; no reabrir caja directa si hay visitaId |
| 084 | Oleada UI — esta spec es el foco peluquería |
| PLAN-UX | Principios mínimo obligatorio + un solo lugar por tarea |

---

## Criterios de cierre global

- [ ] Fases A–D hechas o explícitamente diferidas por Luis  
- [ ] `tasks.md` con QA L2 por fase  
- [ ] `module-map` / guardrails actualizados si se extrae util  
- [ ] Deploy solo con autorización explícita de Luis  

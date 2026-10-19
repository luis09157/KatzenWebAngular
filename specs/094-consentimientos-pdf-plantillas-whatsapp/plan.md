# Plan: Consentimientos — PDF, plantillas y WhatsApp (094)

**Spec:** `specs/094-consentimientos-pdf-plantillas-whatsapp/spec.md`  
**Estado:** in_progress (Fase A+B mínima en código; firma diferida)  
**Fecha:** 2026-10-04

---

## Resumen

Extender el módulo **037** (registro) hacia un flujo de **documento**: plantillas por tipo → preview HTML → PDF (`jspdf`) → WhatsApp con el **mismo límite de adjunto que 092**. Firma digital / Storage / catálogo editable son fases posteriores condicionadas a decisiones de Luis.

---

## Benchmark breve (mercado / práctica vet)

| Enfoque | Ejemplo | Relevancia Katzen |
|---------|---------|-------------------|
| PDF fillable + iniciales por cláusula | Formularios cirugía/anestesia/CPR (clínicas US / VetCor-style) | Contenido del machote: riesgos, autorización, contacto |
| Plantillas por procedimiento + CPR/DNR aparte | Guías tipo VetVisit (surgical + addendum) | Soporta **machotes distintos** y anexos (p. ej. eutanasia / riesgo anestésico) |
| Formulario web + e-sign + PDF | Paperform / Papersign (tablet o pre-cita) | Tablet en recepción = patrón deseable; e-sign legal formal = **fuera** de MVP Katzen |
| Registro en PIMS sin texto | Muchos PMS solo «consent on file» | Es lo que hace **037 hoy** — insuficiente para la expectativa de Luis |

**Lección:** el valor percibido está en **texto claro + PDF + evidencia de aceptación**, no solo en el CRUD. No hace falta eID para un MVP operativo mexicano de clínica pequeña; sí hace falta **machote legible** y **canal WhatsApp realista** (sin adjunto automático en `wa.me`).

---

## Estado del código (inventario)

| Pieza | Ruta / nota |
|-------|-------------|
| Lista + KPIs + CRUD | `consentimientos.component.*` |
| Diálogo alta/edición | `consentimiento-dialog.component.*` — tipo, fecha, `firmado_por`, staff, notas |
| Modelos / tipos | `consentimientos.models.ts` |
| Service RTDB | `consentimientos.service.ts` → `Katzen/Consentimientos` |
| Utils KPI | `consentimientos.util.ts` |
| Rules | `database.rules.json` → `Consentimientos` |
| Portal | `portal-data` + `mapConsentimiento` + ruta list-section |
| PDF/WA reutilizable | `visitas/ticket-digital.util.ts` (`generarPdfTicketBlob`, `compartirTicketWhatsAppPdf`, Web Share) |

---

## Gaps vs expectativa Luis

1. **Machote / plantilla** — no existe texto legal/clínico por tipo.  
2. **Preview** — el dueño (ni el staff) ve qué se «autoriza».  
3. **PDF** — no hay generación ni impresión del documento.  
4. **WhatsApp** — no hay acción; y aunque se agregue, **no se puede adjuntar PDF vía `wa.me`** (igual que 092).  
5. **Firma** — `firmado_por` es nombre tipado; no hay trazo, papel escaneado ni timestamp de aceptación del texto.  
6. **Acciones UI** — solo editar/borrar; faltan Ver / PDF / WhatsApp.

---

## Fases de trabajo (L1 / L2 / L3)

### Fase 0 — L1 (opcional, rápido)

- Chip **Estado** visible (contraste / ancho columna / overflow).  
- Copy del banner: mencionar que el PDF/plantilla viene en 094 (o no, si se implementa pronto).  
- Validación: `npm run build` + 1 screenshot.

### Fase A — L2 · Plantillas + preview HTML

**Entrega:** machotes por `ConsentimientoTipo` en código (TS/markdown o HTML templates), función `buildConsentimientoDocumentoView(tipo, datos)`, diálogo o panel «Ver plantilla / Ver documento» con datos denormalizados (paciente, dueño, clínica, fecha, staff).

- Unit tests del util de plantillas.  
- Sin Storage. Sin cambiar enum `estado` aún.  
- Registro ≤10 líneas en `tasks.md`.

### Fase B — L2 · PDF + WhatsApp (patrón 092)

**Entrega:** `generarPdfConsentimientoBlob` + descargar/imprimir + `compartirConsentimientoWhatsAppPdf` (Web Share → fallback descarga + `wa.me`).

- Botones en `.row-actions` y/o post-guardar Swal (hide loading primero).  
- Teléfono desde `Cliente` cuando exista.  
- Documentar límite adjunto en UI (tooltip / texto Swal).  
- **No** Cloud Function. **No** deploy sin OK Luis.

### Fase C — L2/L3 · Firma (elegir una vía)

| Opción | Nivel | Descripción | RTDB / Storage |
|--------|-------|-------------|----------------|
| **C1 Papel** | L2 | Imprimir PDF → dueño firma → staff marca «Firmado en clínica» (+ notas) | Campos aditivos mínimos |
| **C2 Papel + foto** | L3 | C1 + subir foto del papel firmado | Storage + `firma_url?` |
| **C3 Tablet / canvas** | L3 | Firma en pantalla → PNG | Storage + `firma_url?`, `firmado_at?`, `modo_firma: 'digital'` |

Recomendación técnica inicial: **A → B → C1**; C2/C3 solo si Luis quiere evidencia gráfica en expediente.

### Fase D — L3 · Catálogo de plantillas editable (futuro)

- Nodo `Katzen/ConsentimientoPlantillas/{tipo}` o por sucursal.  
- Editor admin simple (textarea markdown/HTML sanitizado).  
- Rules + plan de rollback + OK Luis. **Fuera del primer corte.**

---

## Archivos previstos (cuando se implemente)

### Angular (Fase A–B)

| Archivo | Acción |
|---------|--------|
| `src/app/consentimientos/consentimiento-documento.util.ts` | crear — view-model + HTML + PDF + share |
| `src/app/consentimientos/consentimiento-documento.util.spec.ts` | crear |
| `src/app/consentimientos/consentimiento-plantillas.ts` (o `/plantillas/*.ts`) | crear — textos por tipo |
| `consentimientos.component.*` | acciones Ver / PDF / WA |
| `consentimiento-dialog.component.*` | preview al cambiar tipo; post-guardar ofrecer PDF/WA |
| `consentimientos.models.ts` | solo si campos aditivos Fase C |

### Firebase (solo Fase C2/C3/D)

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | campos/nodos aditivos |
| Storage rules | path `Consentimientos/` |

### Cypress

| Archivo | Acción |
|---------|--------|
| smoke admin | solo si hay ruta nueva (no aplica) o botón crítico (opcional) |

---

## Flujos propuestos

### Flujo MVP (A+B)

1. Staff abre Nuevo / Editar → elige tipo → ve preview del machote.  
2. Guarda registro 037 (como hoy).  
3. Tras guardar (o desde fila): Descargar PDF / Imprimir / WhatsApp.  
4. WhatsApp: Web Share con PDF si el dispositivo lo permite; si no, descarga + `wa.me` con aviso de adjuntar.

### Errores / límites

| Caso | Comportamiento |
|------|----------------|
| Sin teléfono cliente | Solo descarga PDF + mensaje |
| `wa.me` | Nunca promete adjunto automático |
| Abort Web Share | No error rojo; usuario puede reintentar o usar descarga |
| Loading + PDF | Persistencia primero → `hide()` → luego share/PDF |

---

## Contratos de Datos y UI (resumen)

- **A–B:** sin RTDB obligatorio; UI admin-ui; `jspdf` existente.  
- **C+:** campos opcionales en `Consentimientos`; Storage opcional; móvil ignora.  
- **Rollback:** quitar acciones UI; datos aditivos permanecen.

---

## Decisiones que Luis debe confirmar

1. **Prioridad de fases:** ¿A+B en el primer corte, o también firma (C)?  
2. **Modalidad de firma:** C1 papel / C2 papel+foto / C3 canvas tablet / diferir.  
3. **Contenido legal de machotes:** ¿Luis (o abogado) aporta textos, o borradores clínicos operativos en español latino revisables?  
4. **Tipos prioritarios:** ¿los 7 actuales, o empezar solo `cirugia` + `anestesia` + `eutanasia`?  
5. **¿Ampliar `estado`?** (`borrador` / `pendiente_firma` / `vigente`) vs mantener `vigente`/`revocado` y usar flags.  
6. **Portal:** ¿solo admin en MVP, o dueño puede ver/descargar PDF?  
7. **Storage:** ¿aceptable coste/reglas ahora, o diferir hasta C2/C3?  
8. **CPR/DNR / consentimiento de costos:** ¿anexo en machote cirugía o tipo aparte? (benchmark sugiere anexo)

---

## Plan de Mitigación y Rollback

- Sin tocar nodos legacy de móvil.  
- Sin WhatsApp Business API.  
- Sin segundo mailer.  
- Deploy hosting/rules/storage **solo** con autorización explícita de Luis.

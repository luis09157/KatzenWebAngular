# Spec: Consentimientos — PDF, plantillas y WhatsApp

**ID:** 094-consentimientos-pdf-plantillas-whatsapp  
**Estado:** in_progress  
**Fecha:** 2026-10-04  
**Autor:** Cursor / Luis Alfonso Niño Martínez  
**Nivel:** L2 (fases A–C) → L3 solo si Storage / catálogo RTDB editable  
**Extiende:** `037` (CRUD consentimientos) · reutiliza patrón `092` (jspdf + Web Share / wa.me)  
**Precursor:** investigación 2026-10-04 · **Fase A+B mínima implementada** (machotes + preview + PDF/WA; sin firma)

---

## Problema

En `/admin/consentimientos` el staff ya registra autorizaciones (tipo, fecha, firmante, staff), pero **no hay documento** que el dueño lea y firme: sin machote por procedimiento, sin preview, sin PDF ni envío por WhatsApp. La expectativa de Luis es: **ver el machote**, generar PDF para firmar / mandar por WhatsApp, y **machotes distintos por tipo** (cirugía, anestesia, etc.).

Hoy el módulo es un **libro de registro** (quién firmó / cuándo), no un **flujo de consentimiento informado** con texto legal y evidencia documental.

---

## Diagnóstico actual (037 — done)

| Capacidad | Estado hoy |
|-----------|------------|
| CRUD admin + KPIs + búsqueda | Sí — `src/app/consentimientos/` |
| Tipos fijos en código | Sí — `cirugia`, `anestesia`, `egreso`, `hospitalizacion`, `eutanasia`, `tratamiento`, `otro` |
| «Firma» | Solo texto `firmado_por` (+ parentesco); **sin** canvas, imagen ni PDF firmado |
| RTDB | `Katzen/Consentimientos/{id}` aditivo; rules staff write / client read propios |
| Portal | Lista read-only `/portal/mascotas/:id/consentimientos` (tipo, fecha, firmante) |
| PDF / preview / WhatsApp / plantillas | **No** — fuera de alcance 037 |
| Acciones fila | Solo Editar + Borrar |

**Gap principal:** falta el **contenido del consentimiento** (plantilla) y el **artefacto** (HTML/PDF) + canal WhatsApp.

**Nota UI (L1 opcional):** en smoke local el chip «Estado» a veces no se percibe en la columna (posible contraste/clip); no bloquea el alcance de esta spec pero conviene revisar en Fase A.

---

## Anti-duplicación

| Qué | Ya existe | Spec |
|-----|-----------|------|
| Registro consentimiento | `consentimientos/` | **037** |
| PDF + WhatsApp (Web Share / wa.me sin adjunto auto) | `visitas/ticket-digital.util.ts` + `jspdf` | **092** |
| Texto WhatsApp genérico | `recordatorio-whatsapp.util.ts` / `pos-ticket-whatsapp` | **066** / **071** |
| Marca clínica | `ClinicConfigService` / `clinica-config.util` | config |
| Storage (fotos ficha) | historiales / clientes / productos | varios |

**Decisión de diseño (propuesta):** util dedicado `consentimiento-documento.util.ts` (plantilla → HTML → PDF) inspirado en **092**, **sin** acoplar al ticket POS. Extraer helpers compartidos de share/download solo si el diff lo justifica (no segundo jspdf ni segundo mailer).

---

## User stories (borrador — confirmar con Luis)

### US-1 — Ver machote por tipo

Como **staff**  
Quiero **previsualizar el texto del consentimiento según el tipo de procedimiento**  
Para **saber qué leerá / firmará el dueño**

**Criterios (draft):**

- [x] SC-001: Al elegir tipo (o desde acción «Ver machote»), preview HTML del machote con datos de paciente/dueño/clínica.
- [x] SC-002: Un machote distinto por cada `ConsentimientoTipo` (MVP: textos en código; no editor WYSIWYG).

### US-2 — PDF para imprimir / archivar

Como **staff**  
Quiero **descargar o imprimir un PDF del consentimiento**  
Para **firmar en papel o guardar evidencia**

**Criterios (draft):**

- [x] SC-003: PDF vía **jspdf** (mismo stack que **092**).
- [x] SC-004: Nombre archivo tipo `consentimiento-{tipo}-{paciente}-{fecha}.pdf`.
- [x] SC-005: Acciones en lista/diálogo: Ver / Descargar PDF (imprimir vía PDF del SO; patrón admin-ui).

### US-3 — WhatsApp al dueño

Como **staff**  
Quiero **mandar el consentimiento por WhatsApp**  
Para **que el dueño lo revise o lo tenga a la mano**

**Criterios (draft):**

- [x] SC-006: Mismo límite **092**: `wa.me` **no** adjunta PDF; preferir Web Share con `File` en móvil; fallback descarga + aviso «adjúntalo».
- [x] SC-007: Texto WA con paciente, tipo y fecha; teléfono desde cliente si existe.
- [x] SC-008: Acciones PDF/WA fuera del `try` con loading de guardado (regla **005** / **092**).

### US-4 — Firma (fase posterior — decidir modalidad)

Como **clínica**  
Quiero **dejar evidencia de que el dueño aceptó el texto mostrado**  
Para **fortalecer el registro legal operativo**

**Criterios (draft — sujetos a decisión Luis):**

- [ ] SC-009a (**papel**): checkbox/confirmación «impreso y firmado en clínica» + opcional foto del papel (Storage) **o**
- [ ] SC-009b (**tablet**): canvas firma digital → PNG en Storage + campos `firma_url`, `firmado_at` aditivos
- [ ] SC-010: Estado UI coherente (`borrador` / `pendiente_firma` / `vigente` / `revocado`) — solo si se amplía el enum (aditivo; migrar lecturas con default).

---

## Fuera de alcance (draft)

- Firma electrónica avanzada / eID / NOM-151 / validez notarial
- WhatsApp Business Cloud API / Twilio (servidor)
- Editor de plantillas en UI para staff (Fase futura L3)
- Resend / correo (038 ya existe; no segundo mailer)
- CFDI / PDF certificado PAC
- Reescribir CRUD 037 ni portal (salvo mostrar PDF/link si Luis lo pide después)

---

## Contratos de Datos y UI (Obligatorio)

### Fase A–B (L2 — sin Storage obligatorio)

- **RTDB:** sin cambios obligatorios; plantillas en código. Opcional aditivo: `plantilla_version?: string`, `pdf_generado_at?: string` (metadatos).
- **UI:** acciones en `.row-actions` + diálogo preview; reutilizar `admin-dialog-shell`, KPIs existentes.
- **Deps:** `jspdf` ya en proyecto (**092**).

### Fase C–D (L3 si Luis confirma Storage / estados nuevos)

| Nodo / Storage | Lectura | Escritura | Notas |
|----------------|---------|-----------|-------|
| `Katzen/Consentimientos/{id}` | staff / client propios | staff | campos opcionales: `firma_url?`, `firmado_at?`, `modo_firma?`, `estado` ampliado |
| Storage `Consentimientos/{id}/…` | staff (+ client si portal descarga) | staff | solo si hay firma escaneada / canvas |
| `Katzen/ConsentimientoPlantillas/{tipo}` | staff | admin | **solo** si catálogo editable (no MVP) |

- **Pruebas:** mocks + localhost/emulador; **prohibido** prod.
- **App móvil:** solo campos aditivos; ignora nuevos.

---

## Plan de Mitigación y Rollback

- **Mitigación:** util + UI sobre módulo 037; no tocar móvil.
- **Rollback:** ocultar botones PDF/WA; datos aditivos quedan. Si hubo Storage/rules: revert hosting + rules con OK Luis.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| todos operativos (matriz 072) | sí (mismo módulo 037) |

---

## UI

- Admin: `/admin/consentimientos` (extender)
- Portal: sin cambio en MVP; futuro «ver PDF» si hay URL

---

## Backend

- [ ] Cloud Function: no (MVP)
- [ ] Reglas RTDB: solo si campos/nodos nuevos (L3)
- [ ] Storage rules: solo si firma/archivo (L3)
- [ ] Email: no

---

## Decisiones confirmadas (2026-10-04)

1. Prioridad: **A + B mínima** en este corte (plantillas + preview + PDF/WA).
2. Firma (C): **después** — no canvas/Storage en este corte.
3. Textos: borradores clínicos en español latino generados por el agente (revisables).
4. Tipos: **los 7** actuales en código.
5. Portal / Storage / estados ampliados: diferidos.

Pendiente post-entrega: modalidad de firma (C1/C2/C3), revisión legal de machotes, portal PDF.

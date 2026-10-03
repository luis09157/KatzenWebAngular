# Spec: Ticket digital (CSS imprimible + PDF + WhatsApp)

**ID:** 092-ticket-digital-pdf-whatsapp  
**Estado:** done  
**Fecha:** 2026-10-02  
**Autor:** Cursor / Luis Alfonso Niño Martínez  
**Nivel:** L2  
**Extiende:** `071` (folio + ticket 80 mm), `065` (WhatsApp texto), `036` (print)

---

## Problema

Tras cobrar, el comprobante se ve como texto plano centrado monospace (estilo térmica). Luis necesita un ticket **presentable** para imprimir en impresora normal, descargar y compartir; el PDF debe verse con formato de marca Katzen. El ticket térmico 80 mm debe **seguir existiendo** para impresora de rollo.

---

## Diagnóstico (anti-duplicación)

| Camino existente | Dónde |
|------------------|--------|
| Texto WhatsApp `wa.me` | `pos-ticket-whatsapp.util.ts` (**065**) |
| View-model + print 80 mm | `ticket-80mm.util.ts` + `.ticket-80` en `visita-dialog` (**071**) |
| Post-cobro abierto para WA/print | `visita-dialog` tras `ejecutarFlujoCobro` |

**Decisión:** un util `ticket-digital.util.ts` que reutiliza `buildTicket80View` / `TicketWhatsAppInput`. No segundo sistema de tickets ni segundo POS. Dependencia: **jspdf** (ligera; no había PDF en `package.json`).

---

## User stories

### US-1 — Imprimir con formato CSS

Como **caja / recepción**  
Quiero **imprimir un ticket con marca Katzen y tipografía legible**  
Para **entregar un comprobante presentable** (impresora normal / PDF del sistema)

**Criterios:**

- [x] SC-001: HTML/CSS digital (`ticket-digital`) con clínica, folio, líneas, totales y pie.
- [x] SC-002: Impresión digital vía iframe + `print` (no rompe `@media print` del ticket-80).
- [x] SC-003: Acción «Térmico 80 mm» conserva el flujo existente.

### US-2 — Descargar PDF

Como **caja**  
Quiero **descargar el mismo desglose en PDF**  
Para **archivarlo o enviarlo al dueño**

**Criterios:**

- [x] SC-004: PDF generado con **jspdf** desde el mismo view-model (`generarPdfTicketBlob`).
- [x] SC-005: Nombre de archivo `ticket-{folio}.pdf`.

### US-3 — WhatsApp + PDF (límites documentados)

Como **caja**  
Quiero **enviar el ticket por WhatsApp con PDF**  
Para **que el dueño reciba comprobante formateado**

**Criterios:**

- [x] SC-006: Preferir **Web Share API** con `File` PDF cuando el navegador lo soporte (móvil).
- [x] SC-007: Fallback: **descargar PDF** + abrir `wa.me` con texto del ticket + aviso de adjuntar el PDF.
- [x] SC-008: Documentar que **WhatsApp Web / `wa.me` no adjunta PDF** automáticamente.

### US-4 — Flujo post-cobro

Como **caja**  
Quiero **tras cobrar elegir Mandar / Descargar / Imprimir**  
Para **no buscar botones sueltos**

**Criterios:**

- [x] SC-009: Tras cobro exitoso, diálogo con Descargar PDF / Imprimir / WhatsApp / Cerrar.
- [x] SC-010: Unit tests util + `npm run build` exit 0.

**Lección 2026-10-03 (loading):** las acciones post-cobro (Swal / Web Share / PDF) deben correr **después** de `LoadingService.hide()` — nunca `await` dentro del `try` de cobro. Ver spec **005** US-4 y `tasks.md` follow-up.

---

## Límite WhatsApp (obligatorio en spec)

| Canal | ¿Adjunta PDF? | Comportamiento Katzen |
|-------|---------------|------------------------|
| Web Share API (`navigator.share` + `files`) | Sí, en móviles compatibles (p. ej. Safari iOS / Chrome Android con WhatsApp instalado) | Preferido |
| `https://wa.me/52…?text=` | **No** — solo texto prellenado | Fallback: descarga PDF + mensaje con aviso «adjúntalo» |
| WhatsApp Web (pegar / adjuntar manual) | Manual por el usuario | El PDF queda en Descargas |

No hay API pública de WhatsApp Business en este alcance.

---

## Fuera de alcance

- Envío servidor (Cloud Function / Twilio / WhatsApp Cloud API)
- Cambiar folio / RTDB / caja
- Sustituir o eliminar ticket térmico 80 mm
- Deploy sin OK de Luis

---

## Contratos de Datos y UI

- **RTDB:** ninguno (solo UI/util cliente).
- **Pruebas:** mocks / localhost; unit tests util.
- **UI:** botones en `visita-dialog` + SweetAlert post-cobro; marca `--katzen-verde` / `#0A969B`.
- **Deps:** `jspdf` en `package.json` (documentado aquí).

---

## Testing mínimo

Ver `tasks.md`.

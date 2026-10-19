# Tasks: Consentimientos — PDF, plantillas y WhatsApp (094)

**Spec:** `specs/094-consentimientos-pdf-plantillas-whatsapp/spec.md`  
**Plan:** `specs/094-consentimientos-pdf-plantillas-whatsapp/plan.md`  
**Nivel de cambio:** L2 (A–B) · L3 (C2/C3/D si aplica)

---

## Implementación

### Setup

- [x] Carpeta spec creada (draft) + INDEX regenerado
- [x] Decisiones de Luis confirmadas (A+B; textos agente; 7 tipos; firma después)
- [x] Anti-duplicación: 037 + 092; no segundo jspdf / mailer / POS
- [x] Plan aprobado para codear (A + B mínima)

### Fase 0 — L1 (opcional)

- [ ] Chip Estado visible en tabla (no bloqueante; diferido)
- [ ] `npm run build` + screenshot

### Fase A — L2 Plantillas + preview

- [x] `consentimiento-plantillas.util` + `consentimiento-documento.util`
- [x] Unit tests util (6/6 PASS)
- [x] Preview en diálogo alta/edición + acción «Ver machote» en lista
- [x] Registro QA ≤10 líneas

### Fase B — L2 PDF + WhatsApp

- [x] PDF jspdf (`consentimiento-pdf.util`) + descargar
- [x] WhatsApp Web Share + fallback 092 (límite wa.me documentado en UI)
- [x] Acciones en lista + diálogo preview
- [x] `npm run build` exit 0 (2026-10-04)
- [ ] Smoke visual 375/1280 (Luis en localhost)

### Fase C — Firma (tras decisión)

- [ ] C1 / C2 / C3 según Luis
- [ ] Campos aditivos + Storage/rules si aplica (L3 + OK Luis)

### Fase D — Catálogo editable (futuro)

- [ ] Diferido

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Base CRUD | `src/app/consentimientos/` (**037**) |
| Plantillas (7 tipos) | `consentimiento-plantillas.util.ts` |
| HTML / view-model | `consentimiento-documento.util.ts` |
| PDF + WA | `consentimiento-pdf.util.ts` (reusa `descargarBlob` / `puedeWebSharePdf` de **092**) |
| Preview diálogo | `consentimiento-preview-dialog.component.*` |
| Clínica | `ClinicConfigService` |
| Teléfono WA | `ClientesService.getCliente` + `normalizarTelefonoMx` (**066**) |

---

## Validación (L2 — 2026-10-04)

| Check | Resultado | Notas |
|-------|-----------|-------|
| Unit tests plantillas | PASS | 7/7 ChromeHeadless (incl. umbral 1 hoja) |
| `npm run build` | PASS exit 0 | warnings budget/jspdf previos |
| Preview por tipo | PASS código | diálogo + lista «Ver machote» |
| PDF nombre archivo | PASS test | `consentimiento-{tipo}-{paciente}-{fecha}.pdf` |
| Límite wa.me | DOC | tooltip + Swal adjunto manual |
| Firma canvas/Storage | N/A | diferida Fase C |
| Smoke 375/1280 | PEND | Luis en `:4200` |

### Follow-up L2 — 1 hoja A4 (2026-10-04)

- Machotes 7 tipos acortados (sin relleno verboso; ID compacta + riesgo/autorización + firma papel).
- Umbrales: `CONSENTIMIENTO_CUERPO_MAX_CHARS=2200`, `MAX_WORDS=320` + test.
- PDF: **sin** `addPage`; tipografía ~10 pt + scale-down si sobra altura.
- Preview CSS: densidad ~10.5–11 px + `@media print` / `page-break-inside: avoid`.
- Verificar PDF 1 pág: Descargar PDF → abrir → comprobar 1/1; o imprimir preview.

---

## Cierre

- [x] Spec → `in_progress` (Fase A+B mínima)
- [ ] Spec → `done` con smoke visual + OK Luis sobre textos
- [x] Actualizar `module-map` / `agent-guardrails` (extractos 094)

# Tasks: Ticket digital PDF / WhatsApp

**Spec:** `specs/092-ticket-digital-pdf-whatsapp/spec.md`  
**Nivel de cambio:** L2

---

## Implementación

- [x] Spec 092 + anti-duplicación (reutiliza 065/071)
- [x] Dep `jspdf` en `package.json`
- [x] Util `ticket-digital.util.ts` + spec
- [x] Wire `visita-dialog`: imprimir digital, térmico 80 mm, PDF, WhatsApp+PDF, Swal post-cobro
- [x] Memoria: guardrails + module-map + INDEX

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Nuevo | `src/app/visitas/ticket-digital.util.ts` (+ `.spec.ts`) |
| Reutilizado | `buildTicket80View`, `generarTextoTicketWhatsApp`, `urlWhatsAppTicket` |
| UI | `visita-dialog.component.ts/html` |
| Dep | `jspdf` |
| Spec | `specs/092-ticket-digital-pdf-whatsapp/` |

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | OK | warning budget 2.5 MB (total ~3.02 MB); jspdf lazy |
| Unit tests util | OK | 5/5 `ticket-digital.util.spec` |
| Smoke 375 / 1280 | OK local | post-cobro Swal + botones PDF/print/80mm/WA |
| RTDB | N/A | sin cambios |
| Chips / loading | N/A | |

```
# Output relevante (build / tests)
npm run build → exit 0
ng test --include='**/ticket-digital.util.spec.ts' → 5 SUCCESS
```

---

## Follow-up 2026-10-03 — overlay «Cobrando…» trabado (L2)

| Ítem | Resultado |
|------|-----------|
| Causa | `await ofrecerAccionesPostCobro()` (Swal + PDF/`navigator.share`/wa.me) iba **dentro** del `try` de `confirmarCobro` **antes** del `finally` → si share/PDF no resolvía, `hide()` no corría |
| Fix | `hide()` en `finally` tras persistir cobro; Swal post-cobro **después** (solo si `cobroOk`) |
| Archivo | `visita-dialog.component.ts` → `confirmarCobro` |
| Cobro real | Intacto (persistencia ya ocurría; solo UI overlay) |
| `npm run build` | exit 0 |
| `check-loading-antipattern` | OK (no era show→close; script pasa) |

### Lección permanente (no reabrir)

- **Loading:** nunca `await` Swal/share/PDF dentro del `try` con `LoadingService.show('Cobrando…')` antes del `finally { hide() }`. Orden: persistir → hide → acciones. Documentado en **005** US-4, `ADMIN-UI-ARCHITECTURE` § Loading regla 4, `agent-guardrails` Decisiones.
- **RTDB:** sanitizar payloads (`omitUndefinedRtdb` / `sanitizeVisitaLinea(s)ForRtdb`) — Firebase rechaza `undefined` anidado (`costo_dia`, `citaId`, `banioId`, `pensionId`, etc.).
- **Script:** `check-loading-antipattern.mjs` **no** se amplió a await-Swal (heurística frágil); cobertura = solo `show→close`.

---

## Memoria actualizada

- [x] `agent-guardrails.md` anti-duplicación + decisión (loading post-éxito + RTDB `undefined`)
- [x] `module-map.md` ticket digital
- [x] Spec **005** US-4 antipatrón B + `ADMIN-UI-ARCHITECTURE` / guía QA / constitution
- [x] `node scripts/specs-index.mjs` tras marcar done

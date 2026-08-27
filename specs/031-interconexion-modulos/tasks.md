# Tasks: Interconexión de módulos

**Spec:** `specs/031-interconexion-modulos/spec.md`  
**Plan:** `specs/031-interconexion-modulos/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec 031 + análisis «Qué el dueño no había tomado en cuenta»
- [x] Plan con Contratos + Mitigación/Rollback

### Frontend / rules

- [x] Prefill baños defaults+plantillas (SC-001…004)
- [x] Atajos expediente + `cliente_id` en baño (SC-005…007)
- [x] Cita→caja (SC-008)
- [x] Stock→OC + KPIs links (SC-009…010)
- [x] Portal pensión + recordatorios + rules (SC-011…014)
- [x] FCM token fix Angular (SC-015…016)
- [x] Finanzas: hint margen + refuerzo pensión en ingresos por servicio
- [x] Pulido OC/movimientos (enlace producto→OC, alertas→OC)
- [x] Mocks + Cypress smoke portal pensión

---

## Testing y validación exhaustiva

> Guía: `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega

- [x] Guía QA aplicada (§1–§4 relevantes)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke
- [x] Tabla resultados rellenada **antes** de `[x]`
- [x] Chips / picker / loading / timepicker si aplican

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Prefill baño P/M/G con defaults | PASS | `banio-prefill.util` + dialog reapply |
| Prefill baño vía plantilla | PASS | fallback plantilla banio/corte |
| Expediente → cita/pensión IDs | PASS | `CitaDialogModule` / `PensionDialogModule` + `cliente_id` |
| Cita completada → caja | PASS | menú «Registrar en caja» + `citaId` |
| Stock bajo → OC prefill | PASS | alertas + productos + queryParams órdenes |
| Dashboard KPI links | PASS | `/admin/finanzas`, citas, baños, alertas, clientes |
| Portal pensión read-only | PASS | rutas + mapper sin costos |
| Portal recordatorios | PASS | lista read-only |
| FCM register (SW ready) | PASS | `serviceWorkerRegistration` + no re-pedir si granted |
| Finanzas márgenes / ingresos | PASS | hint KPI + refuerzo pensión |
| UI chips / empty / panel-search | PASS | sin regresión aparente |
| Build `npm run build` | PASS | exit 0 · 2026-08-26 · hash 89525e2ce8d186da |
| Servidor :4200 | PASS | `ng serve` vivo |
| Resend / correo | N/A | no tocado |

```
# Output npm run build
Exit 0 — production build OK (budget warning initial >2MB preexistente)
Hash: 89525e2ce8d186da
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-016

---

## Cierre

- [x] Validación pre-entrega completa
- [x] `spec.md` → `done`
- [x] Commit / push / hosting (autorizado Luis)
- [x] Correo portal NO tocado

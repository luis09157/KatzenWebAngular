# Tasks: Notas internas historial

**Spec:** `specs/010-notas-internas-historial/spec.md`  

---

## Implementación

- [x] Modelo + form + detalle
- [x] Portal mapper excluye `notas_internas`
- [x] Spec/plan documentan límite de aislamiento RTDB

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA formularios (campo opcional, hint) — UI verificada en Cypress
- [x] `npm run build` — exit 0 (2026-08-26)
- [x] Live preview :4200 vivo
- [x] Unit: `portal-mapper.util.spec.ts` — **8/8 SUCCESS** (incluye «never exposes notas_internas»)
- [x] Cypress: expediente → Nuevo historial → `textarea[formControlName=notas_internas]` visible
- [x] Cypress: `/admin/historiales` → Nuevo abre picker (flujo alcanzable hacia el form)
- [ ] Cypress detalle historial con valor de `notas_internas` — **no ejecutado** (requeriría crear/guardar historial)
- [ ] Aislamiento RTDB (cliente portal no lee campo) — **solo mapper unit**; rules/portal E2E no cubren el campo
- [ ] App móvil ignora campo — **fuera de alcance web / no verificado**

### Tabla de resultados

| Ítem | Resultado |
|------|-----------|
| Campo opcional en form | OK Cypress (visible + label) |
| Detalle muestra si hay valor | OK en código HTML; **smoke E2E detalle no corrido** |
| Portal no mapea internas | OK unit `mapHistorial` |
| Build | OK exit 0 |
| functions:build | OK (N/A feature; corrido en sesión) |

### Evidencia (2026-08-26)

```
ng test --include='**/portal-mapper.util.spec.ts' → 8 SUCCESS
npx cypress run --spec cypress/e2e/admin-features-008-010-smoke.cy.ts → 3 passing
```

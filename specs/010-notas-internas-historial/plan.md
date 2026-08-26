# Plan técnico: Notas internas historial

**Spec:** `specs/010-notas-internas-historial/spec.md`  
**Estado:** approved  

---

## Resumen

Campo aditivo `notas_internas` + UI admin + exclusión en portal mapper. Rules de write clínico ya limitan a doctor/admin (008).

---

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/app/core/models.ts` | campo opcional |
| `historial-dialog.component.*` | form + hint |
| `historial-detalle.component.html` | sección staff |
| `portal-mapper.util.ts` | no mapear |

---

## Contratos + Mitigación

- Aditivo; rollback = dejar de escribir el campo (datos legacy inocuos).
- Riesgo: client token lee el nodo completo → mitigación portal mapper; documentar móvil.

## Deploy

Sin functions ni database extra.

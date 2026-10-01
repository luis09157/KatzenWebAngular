# Tasks: Modularización POS / Core (076)

**Spec:** `specs/076-modularizacion-pos-core/spec.md`  
**Nivel de cambio:** L2

---

## Implementación

- [x] `pos-wizard.util.ts` + `.spec.ts` — pasos, labels, destino, paso inicial
- [x] `pos-bloqueo.util.ts` + `.spec.ts` — hints / bloqueos / puedeGuardar
- [x] Cablear `visita-dialog.component.ts`
- [x] Core: `login-error-copy.util` + `fcm-copy.util`; re-exports portal; Auth/Landing/FCM
- [x] Migrar `formatMoneyMx` en visita-dialog + cliente-cuenta (+ caja-corte)
- [x] Barrel `core/utils/index.ts`; `module-map.md`; plan 075 pendientes
- [x] Pacientes: **diferido** a oleada 3 → cerrado en **077** (`paciente-fecha` / `paciente-timeline`)
- [x] Sheets POS: **diferido** a oleada 3 → cerrado en **077** (`pos-sheet.util`)

---

## Validación (L2)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| Unit utils | **OK** | 33/33 SUCCESS (wizard, bloqueo, login, fcm, portal re-export, pos-copy) |
| `npm run lint` | **OK** | 0 errors / 578 warnings preexistentes |
| `npm run build` | **OK** | exit 0; Hash e2d8a9ed38924cc3; budget warning preexistente |
| RTDB | N/A | sin tocar |
| Smoke UI POS | mismos textos | sin cambio semántico |

---

## Cierre

- [x] Validación L2 registrada
- [x] Spec → done + INDEX regenerado
- [x] Continuación: oleada 3 → **077**; specs vivas → **078** (2026-10-01)
- [ ] Commit / deploy — **no** (Luis no autorizó)

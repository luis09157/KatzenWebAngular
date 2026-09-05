# Tasks: POS — venta rápida guiada

**Spec:** `specs/065-pos-venta-rapida-guiada/spec.md`  
**Nivel de cambio:** L2

---

## Implementación

- [x] Utils: `pos-ticket-whatsapp.util.ts` (≥5 casos) y `cliente-picker-search.util.ts`
- [x] Picker: placeholder teléfono, `permitirCrear`, `@Output` crear, autofocus
- [x] `ClienteDialog` / `PacienteAdminDialog` modo `rapido`
- [x] POS: mostrador por defecto, bloque cliente opcional, WhatsApp tras cobro
- [x] Validación L2 (lint / test:ci / build / smoke 375·1280)
- [x] Ola 2: `permitirCrear` en cita / vacuna / baño / pensión / consentimiento (`alta-rapida-picker.helper.ts`)

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run lint` (0 errores) | OK | 0 errors, 542 warnings preexistentes |
| `npm run test:ci` | OK | 337 SUCCESS |
| `npm run build` (exit 0) | OK | exit 0 (budget warning 2.60 MB) |
| Smoke emulador 375 / 1280 | OK | login `admin@katzen.test`; venta mostrador + cobro; Consulta pide dueño; Cliente nuevo; búsqueda `555`; WhatsApp. Shots `/tmp/kz-065/` |

```
lint: 0 errors
test:ci: 337 SUCCESS
build: exit 0
smoke: SMOKE_OK 2026-09-04 emuladores 9099/9000
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 POS abre en caja/petshop con `__mostrador__`
- [x] SC-002 bloque cliente opcional
- [x] SC-003 consulta/peluquería piden dueño+mascota
- [x] SC-004 ClienteDialog `modo: 'rapido'`
- [x] SC-005 ¿Trae mascota? → PacienteAdminDialog reducido
- [x] SC-006 `@Output` crear solo con `permitirCrear` (POS)
- [x] SC-007 placeholder teléfono / ≥3 dígitos / autofocus
- [x] SC-008 táctil ≥44px + `inputmode="decimal"`
- [x] SC-009 util WhatsApp ≥5 casos
- [x] SC-010 `wa.me/52{tel}?text=`

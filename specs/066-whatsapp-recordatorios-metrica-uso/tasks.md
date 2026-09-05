# Tasks: Recordatorio por WhatsApp + métrica de uso por módulo

**Spec:** `specs/066-whatsapp-recordatorios-metrica-uso/spec.md`  
**Plan:** no aplica (L2)  
**Nivel de cambio:** L2

---

## Implementación

### Frontend

- [x] `src/app/recordatorios/recordatorio-whatsapp.util.ts` + `.spec.ts` (normalizar teléfono, fecha larga es, mensaje, URL, fecha chip)
- [x] `recordatorios.component.*`: mapa clientes, acciones WhatsApp / Llamar, chip «WhatsApp ✓», `whatsappEnviadoEn` vía `actualizarRecordatorio`
- [x] `src/app/core/services/usage-metrics.service.ts` + `.spec.ts`
- [x] `admin-main-layout.component.ts`: `startTracking()`
- [x] `src/app/usuarios/uso-sistema-panel.component.*` + declaración en `UsuariosModule` + sección en `usuarios.component.html`

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run lint` | exit 0 | warnings preexistentes; sin errores en archivos 066 |
| `npm run test:ci` | exit 0 | 337 SUCCESS (WhatsApp util 10 casos; UsageMetrics 7) |
| `npm run build` (exit 0) | exit 0 | budget initial 2.60 MB (preexistente) |
| Smoke emulador 375 / 1280 | ok | login `admin@katzen.test`; capturas `/tmp/kz-066/` |
| RTDB aditiva / compatible app móvil | ok | solo `whatsappEnviadoEn?` vía `update()` |
| Chips completos + loading contextual | ok | chip «WhatsApp ✓ 4 sep» overflow visible; `LOADING_MESSAGES.saving` |

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-009 (ver spec)

---

## Cierre

- [x] Validación registrada
- [x] `spec.md` → `done` + `node scripts/specs-index.mjs`
- [ ] Commit — solo si Luis lo pide

# Tasks: 089 Pensión tarifas / flujo

**Nivel:** L2 · Spec `089-pension-tarifas-y-flujo/spec.md`

---

## Fase 0 — hecha
## Fase 1 — hecha

## Fase 2 (2026-10-02) — hecha en código

- [x] `pension-cobro.util.ts` — descripción / concepto con paquete
- [x] Wire: cobro caja, agregar a visita, por-cobrar-hoy
- [x] Alta nueva → `estado: activa` (cobra hoy sin check-in extra)
- [x] Tests cobro + por-cobrar + build
- [x] Spec done · memoria · INDEX

## Deploy (autorizado Luis 2026-10-02)

- [x] `firebase deploy --only hosting` → https://katzen-a0e3e.web.app (F0–F2)
- [x] Spec 063: `retainedReleaseCount=1`; DELETE 6 no live; live `e854ad70ebb241a0`; HTTP 200
- [x] Redeploy UI simplificada (fechas → días × paquete, sin costos) 2026-10-02 noche; live `29560627248d336e` + 063

---

## Validación Fase 2

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| Unit tests cobro + tarifas + por-cobrar | OK | 15 SUCCESS |
| `npm run build` | OK exit 0 | 2026-10-02 |

---

## Código Fase 2

| Qué | Ruta |
|-----|------|
| Cobro texto | `pension/pension-cobro.util.ts` |
| Lista pensión | `pension.component.ts` |
| Por cobrar | `visitas/por-cobrar-hoy.util.ts` |
| Alta | `pension-dialog` default `activa` |
| Payload RTDB sin undefined | `pension/pension-estancia-payload.util.ts` |

---

## Follow-up bugfix (2026-10-02) — `costo_dia` undefined

**Causa:** tras simplificar el diálogo (sin UI de costo), `guardar` / `crearEstancia` seguían mandando `costo_dia: undefined` (y a veces `costo_total_estimado`). RTDB rechaza `undefined`.

**Fix L2:** util `omitUndefinedRtdb` + `buildPensionEstanciaCreatePayload`; wire en `PensionService` y diálogo. `costo_dia` opcional: se omite si no hay costo interno (no se fuerza 0). Cobro sigue en `precio_dia` / `precio_total`.

| Verificación | Resultado |
|--------------|-----------|
| Unit `pension-estancia-payload.util.spec` | 4 SUCCESS |
| `npm run build` | OK exit 0 |

# Spec 112 — Pausa de avisos automáticos al dueño (interruptor)

**Estado:** código listo · deploy de `functions:fcm` lo corre Luis · **Nivel:** L3 (functions) · **Pidió:** Luis (2026-10-27: «que aún no se manden automáticamente porque seguimos en pruebas»; autorizó revisar y pausar)

## Hallazgo
`functions-fcm` está desplegado en producción (052 tasks: creado 2026-08-29 por Luis, scheduler actualizado 2026-09-04; código sin cambios desde entonces):
- `onRecordatorioWritePush`: al guardar un recordatorio pendiente → inbox del portal del dueño + push FCM.
- `onVacunaPushSchedule` (10:00 MTY): vacuna/desparasitación D-7 y D-0 → dueño (inbox + push) + resumen al personal.
- `onVacunaCreatedInbox`: al registrar vacuna → inbox «Nueva vacuna registrada» (dueños con portal).
Producción hoy: 0 recordatorios, 0 avisos de clínica → nunca se ha mandado nada, pero lo haría en cuanto una vet confirme un refuerzo.

## Cambio
- `avisos-dueno-gate.ts`: lee `Katzen/Config/clinica/avisosAutomaticosAlDueno`; solo `true` enciende. Si no se puede leer → apagado.
- Apagado: las dos funciones de write salen sin escribir nada; el scheduler no avisa a dueños ni marca recordatorios, pero **sí** manda el resumen al personal (NotificacionesClinica + push staff).
- Encender (cuando Luis diga): poner `avisosAutomaticosAlDueno: true` en `Katzen/Config/clinica` (admin). Sin redeploy.
- Test: `avisosAlDuenoEncendidos` (13/13 tests de functions-fcm OK, compilado con tsc).

## Deploy (Luis, en su Mac)
```bash
cd ~/Documents/GitHub/KatzenWebAngular/functions-fcm && npm run build && cd .. && firebase deploy --only functions:fcm --project katzen-a0e3e
```
Rollback: `git revert` de este commit + mismo comando.

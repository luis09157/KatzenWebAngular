# Tasks: 088 fix borrar personal

**Nivel:** L3  

## Implementación

- [x] Fix `updateStaffUser`
- [x] UI refresh + mensaje
- [x] Spec / plan / memoria

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run functions:build` | OK | tsc functions + functions-fcm |
| `npm run build` | OK exit 0 | 2026-10-02 |
| Deploy `updateStaffUser` | OK | 2026-10-02 `firebase deploy --only functions:updateStaffUser` — Successful update us-central1 |
| Smoke borrar staff | confirmado Luis | Sthefany ya estaba borrada en RTDB; fix evita el error falso a futuro |

## Código

| Qué | Ruta |
|-----|------|
| Function | `functions/src/index.ts` (`updateStaffUser`) |
| UI | `usuarios.component.ts`, `usuarios.service.ts` |
| Tipos | `firebase-functions.service.ts` |

## Memoria

- [x] guardrails / domain-context callable note
- [x] INDEX

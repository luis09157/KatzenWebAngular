# Plan: Fix borrar personal (Auth missing)

**Spec:** 088 · **Nivel:** L3  

## Cambios

1. `functions/src/index.ts` → `updateStaffUser`: tolerar `auth/user-not-found`; no forzar `AuthPerfiles.activo=true`; crear AuthPerfiles mínimo si falta; revoke tokens al desactivar.
2. UI `usuarios.component.ts` + `usuarios.service.ts`: devolver `message`; refrescar lista en error.
3. Tipos `UpdateStaffResult.authUserExists`.

## Deploy (solo con OK de Luis)

```bash
npm run functions:build
firebase deploy --only functions:updateStaffUser
# opcional UI:
firebase deploy --only hosting
```

## Rollback

Redeploy commit anterior de `updateStaffUser`.

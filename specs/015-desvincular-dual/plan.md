# Plan: Desvincular perfil dual

**Spec:** 015  
**Estado:** approved

## Resumen

Callable espejo de `linkStaffPortalCliente` + botón UI en Personal staff.

## Contratos de Datos y UI (Obligatorio)

- Impacto RTDB: solo updates aditivos / nulls en campos opcionales.
- Sin eliminar nodos Usuarios / Cliente / Auth.
- UI: `usuarios.component` + Swal confirmación.

## Plan de Mitigación y Rollback

| Escenario | Rollback |
|-----------|----------|
| Callable mid-fail | Re-vincular con `linkStaffPortalCliente` |
| Claims stale | `syncMyClaims` / re-login |
| UI | revert commit |

## Deploy

```bash
npm run functions:build
firebase deploy --only functions:unlinkStaffPortalCliente
firebase deploy --only hosting
```

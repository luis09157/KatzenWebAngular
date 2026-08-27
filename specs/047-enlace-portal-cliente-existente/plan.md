# Plan: 047 Enlace portal ↔ cliente clínico

## Contratos de Datos y UI (Obligatorio)

Ver `spec.md`. Resumen:

- **Ola 1:** UI en `cliente-dialog` + opcional chip listado; callables existentes `provisionPortalClient` / `resendPortalClientAccess`.
- **Ola 2:** Cambiar `registerPortalOwner` en `functions` para vincular por correo antes de crear Cliente.
- Campos aditivos opcionales: `portalLinkedFrom`, timestamps ya existentes.

### Plan de Mitigación y Rollback

| Riesgo | Mitigación | Rollback |
|--------|------------|----------|
| Staff sin permiso callable | Mensaje + “pide a admin / Usuarios” | Solo UI |
| Vínculo correo incorrecto (typo en ficha) | Solo match exacto correo ola 2 | Desactivar portal + corregir correo (proceso manual) |
| Resend falla | Aviso `emailSent: false` (ya existe) | Reenviar desde ficha |

## Archivos previstos

### Ola 1
- `src/app/clientes/cliente-dialog.component.{html,ts,scss}`
- `src/app/clientes/clientes.component.html` (chip opcional)
- `specs/047-*/tasks.md`

### Ola 2
- `functions/src/index.ts` (`registerPortalOwner`)
- Copy landing `landing.component` si hay mensaje de éxito
- Tests functions si existen

## Dependencias

- 002 / 013 / 038 (Resend desplegado).
- No bloquea 046 UX.

## Orden de entrega

1. Spec + plan + tasks (este paquete)
2. Ola 1 UI + QA
3. Ola 2 callable + QA + deploy functions **con OK Luis**
